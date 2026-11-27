package middleware

import (
	"context"
	"crypto"
	"crypto/ecdsa"
	"crypto/ed25519"
	"crypto/elliptic"
	"crypto/rsa"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"math"
	"math/big"
	"net/http"
	"sync"
	"time"
)

const (
	defaultJWKSCacheTTL  = 1 * time.Hour
	defaultHTTPTimeout   = 5 * time.Second
	maxJWKSResponseBytes = 1 << 20 // 1 MiB safety limit
	minRSAModulusBits    = 2048
)

var (
	errKeyNotFound = errors.New("signing key not found in JWKS")
)

type jwksDocument struct {
	Keys []jwkKey `json:"keys"`
}

type jwkKey struct {
	Kty string `json:"kty"`
	Kid string `json:"kid"`
	Use string `json:"use"`
	Alg string `json:"alg"`
	Crv string `json:"crv"`
	N   string `json:"n"`
	E   string `json:"e"`
	X   string `json:"x"`
	Y   string `json:"y"`
}

type cachedJWK struct {
	publicKey crypto.PublicKey
	alg       string
}

// JWKSClient fetches, parses, and caches public signing keys from a JWKS endpoint.
type JWKSClient struct {
	url        string
	httpClient *http.Client
	cacheTTL   time.Duration

	mu        sync.RWMutex
	keys      map[string]cachedJWK
	fetchedAt time.Time

	refreshMu sync.Mutex
}

// NewJWKSClient creates a JWKSClient with sensible defaults for caching and HTTP timeouts.
func NewJWKSClient(jwksURL string) *JWKSClient {
	return &JWKSClient{
		url: jwksURL,
		httpClient: &http.Client{
			Timeout: defaultHTTPTimeout,
		},
		cacheTTL: defaultJWKSCacheTTL,
		keys:     make(map[string]cachedJWK),
	}
}

// GetKey returns the public key matching kid.
// It uses the in-memory cache when fresh and refreshes from the JWKS endpoint
// when the cache is expired or when an unknown kid is encountered.
func (c *JWKSClient) GetKey(ctx context.Context, kid string) (crypto.PublicKey, error) {
	entry, err := c.getEntry(ctx, kid)
	if err != nil {
		return nil, err
	}
	return entry.publicKey, nil
}

// GetKeyForAlg returns the public key matching kid after verifying that the JWK
// metadata (alg, kty, crv) is compatible with the JWT signing algorithm.
func (c *JWKSClient) GetKeyForAlg(ctx context.Context, kid, tokenAlg string) (crypto.PublicKey, error) {
	if tokenAlg == "" {
		return nil, errors.New("missing token signing algorithm")
	}

	entry, err := c.getEntry(ctx, kid)
	if err != nil {
		return nil, err
	}

	if entry.alg != "" && entry.alg != tokenAlg {
		return nil, fmt.Errorf("JWK algorithm %q does not match token algorithm %q", entry.alg, tokenAlg)
	}

	if !isPublicKeyCompatibleWithAlg(entry.publicKey, tokenAlg) {
		return nil, fmt.Errorf("JWK key type is incompatible with token algorithm %q", tokenAlg)
	}

	return entry.publicKey, nil
}

func (c *JWKSClient) getEntry(ctx context.Context, kid string) (cachedJWK, error) {
	if kid == "" {
		return cachedJWK{}, errors.New("missing key id")
	}

	if entry, ok := c.lookupFresh(kid); ok {
		return entry, nil
	}

	if err := c.refresh(ctx, kid); err != nil {
		return cachedJWK{}, err
	}

	c.mu.RLock()
	entry, ok := c.keys[kid]
	c.mu.RUnlock()
	if !ok {
		return cachedJWK{}, errKeyNotFound
	}

	return entry, nil
}

func (c *JWKSClient) lookupFresh(kid string) (cachedJWK, bool) {
	c.mu.RLock()
	defer c.mu.RUnlock()

	if c.fetchedAt.IsZero() || time.Since(c.fetchedAt) >= c.cacheTTL {
		return cachedJWK{}, false
	}

	entry, ok := c.keys[kid]
	return entry, ok
}

func (c *JWKSClient) refresh(ctx context.Context, targetKid string) error {
	c.refreshMu.Lock()
	defer c.refreshMu.Unlock()

	// Re-check after acquiring the refresh lock in case another goroutine
	// just refreshed the JWKS and populated targetKid.
	if _, ok := c.lookupFresh(targetKid); ok {
		return nil
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, c.url, nil)
	if err != nil {
		return fmt.Errorf("building JWKS request: %w", err)
	}
	req.Header.Set("Accept", "application/json")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("fetching JWKS: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("JWKS endpoint returned status %d", resp.StatusCode)
	}

	body, err := io.ReadAll(io.LimitReader(resp.Body, maxJWKSResponseBytes+1))
	if err != nil {
		return fmt.Errorf("reading JWKS response: %w", err)
	}
	if len(body) > maxJWKSResponseBytes {
		return errors.New("JWKS response exceeds maximum allowed size")
	}

	var doc jwksDocument
	if err := json.Unmarshal(body, &doc); err != nil {
		return fmt.Errorf("decoding JWKS response: %w", err)
	}

	parsed := make(map[string]cachedJWK, len(doc.Keys))
	seenKids := make(map[string]struct{}, len(doc.Keys))
	for _, k := range doc.Keys {
		if k.Kid == "" {
			continue
		}
		if k.Use != "" && k.Use != "sig" {
			continue
		}
		if _, dup := seenKids[k.Kid]; dup {
			delete(parsed, k.Kid)
			continue
		}
		seenKids[k.Kid] = struct{}{}

		pub, err := parseJWKPublicKey(k)
		if err != nil {
			continue
		}
		if k.Alg != "" && !isPublicKeyCompatibleWithAlg(pub, k.Alg) {
			continue
		}
		parsed[k.Kid] = cachedJWK{
			publicKey: pub,
			alg:       k.Alg,
		}
	}

	if len(parsed) == 0 {
		return errors.New("JWKS response contained no usable signing keys")
	}

	c.mu.Lock()
	c.keys = parsed
	c.fetchedAt = time.Now()
	c.mu.Unlock()

	return nil
}

func isPublicKeyCompatibleWithAlg(pub crypto.PublicKey, alg string) bool {
	switch k := pub.(type) {
	case *ecdsa.PublicKey:
		switch alg {
		case "ES256":
			return k.Curve == elliptic.P256()
		case "ES384":
			return k.Curve == elliptic.P384()
		case "ES512":
			return k.Curve == elliptic.P521()
		default:
			return false
		}
	case *rsa.PublicKey:
		switch alg {
		case "RS256", "RS384", "RS512", "PS256", "PS384", "PS512":
			return true
		default:
			return false
		}
	case ed25519.PublicKey:
		return alg == "EdDSA"
	default:
		return false
	}
}

func parseJWKPublicKey(k jwkKey) (crypto.PublicKey, error) {
	switch k.Kty {
	case "EC":
		return parseECPublicKey(k)
	case "RSA":
		return parseRSAPublicKey(k)
	case "OKP":
		return parseOKPPublicKey(k)
	default:
		return nil, fmt.Errorf("unsupported key type: %s", k.Kty)
	}
}

func parseECPublicKey(k jwkKey) (*ecdsa.PublicKey, error) {
	if k.X == "" || k.Y == "" {
		return nil, errors.New("missing EC public key coordinates")
	}

	var curve elliptic.Curve
	switch k.Crv {
	case "P-256":
		curve = elliptic.P256()
	case "P-384":
		curve = elliptic.P384()
	case "P-521":
		curve = elliptic.P521()
	default:
		return nil, fmt.Errorf("unsupported EC curve: %s", k.Crv)
	}

	xBytes, err := base64.RawURLEncoding.DecodeString(k.X)
	if err != nil {
		return nil, fmt.Errorf("decoding EC x coordinate: %w", err)
	}
	yBytes, err := base64.RawURLEncoding.DecodeString(k.Y)
	if err != nil {
		return nil, fmt.Errorf("decoding EC y coordinate: %w", err)
	}

	coordSize := (curve.Params().BitSize + 7) / 8
	if len(xBytes) != coordSize || len(yBytes) != coordSize {
		return nil, fmt.Errorf("invalid EC coordinate length for curve %s", k.Crv)
	}

	x := new(big.Int).SetBytes(xBytes)
	y := new(big.Int).SetBytes(yBytes)
	if !curve.IsOnCurve(x, y) {
		return nil, errors.New("EC point is not on curve")
	}

	return &ecdsa.PublicKey{
		Curve: curve,
		X:     x,
		Y:     y,
	}, nil
}

func parseRSAPublicKey(k jwkKey) (*rsa.PublicKey, error) {
	if k.N == "" || k.E == "" {
		return nil, errors.New("missing RSA public key parameters")
	}

	nBytes, err := base64.RawURLEncoding.DecodeString(k.N)
	if err != nil {
		return nil, fmt.Errorf("decoding RSA modulus: %w", err)
	}
	eBytes, err := base64.RawURLEncoding.DecodeString(k.E)
	if err != nil {
		return nil, fmt.Errorf("decoding RSA exponent: %w", err)
	}
	if len(nBytes) == 0 || len(eBytes) == 0 {
		return nil, errors.New("empty RSA public key parameters")
	}

	eBig := new(big.Int).SetBytes(eBytes)
	if !eBig.IsInt64() {
		return nil, errors.New("RSA exponent overflows int64")
	}
	e64 := eBig.Int64()
	if e64 <= 1 || e64 > int64(math.MaxInt) || e64%2 == 0 {
		return nil, errors.New("invalid RSA public exponent")
	}

	n := new(big.Int).SetBytes(nBytes)
	if n.Sign() <= 0 || n.BitLen() < minRSAModulusBits {
		return nil, errors.New("invalid RSA modulus")
	}

	return &rsa.PublicKey{
		N: n,
		E: int(e64),
	}, nil
}

func parseOKPPublicKey(k jwkKey) (ed25519.PublicKey, error) {
	if k.Crv != "Ed25519" {
		return nil, fmt.Errorf("unsupported OKP curve: %s", k.Crv)
	}
	if k.X == "" {
		return nil, errors.New("missing Ed25519 public key")
	}

	xBytes, err := base64.RawURLEncoding.DecodeString(k.X)
	if err != nil {
		return nil, fmt.Errorf("decoding Ed25519 public key: %w", err)
	}
	if len(xBytes) != ed25519.PublicKeySize {
		return nil, errors.New("invalid Ed25519 public key length")
	}

	return ed25519.PublicKey(xBytes), nil
}
