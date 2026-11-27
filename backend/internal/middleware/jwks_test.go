package middleware

import (
	"bytes"
	"context"
	"crypto/ecdsa"
	"crypto/elliptic"
	"crypto/rand"
	"crypto/rsa"
	"encoding/base64"
	"encoding/json"
	"math/big"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

func rsaPublicKeyToJWK(kid, alg string, pub *rsa.PublicKey) jwkKey {
	return jwkKey{
		Kty: "RSA",
		Kid: kid,
		Use: "sig",
		Alg: alg,
		N:   base64.RawURLEncoding.EncodeToString(pub.N.Bytes()),
		E:   base64.RawURLEncoding.EncodeToString(big.NewInt(int64(pub.E)).Bytes()),
	}
}

func TestParseRSAPublicKeyHardening(t *testing.T) {
	rsaKey, err := rsa.GenerateKey(rand.Reader, 2048)
	if err != nil {
		t.Fatalf("generating 2048-bit RSA key: %v", err)
	}
	validJWK := rsaPublicKeyToJWK("rsa-1", "RS256", &rsaKey.PublicKey)

	if _, err := parseRSAPublicKey(validJWK); err != nil {
		t.Fatalf("expected valid 2048-bit RSA JWK to succeed, got: %v", err)
	}

	// Exponent overflowing int64 (9 bytes of 0xFF)
	overflowE := base64.RawURLEncoding.EncodeToString([]byte{0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff})
	cases := []struct {
		name string
		jwk  jwkKey
	}{
		{
			name: "missing modulus",
			jwk:  jwkKey{Kty: "RSA", N: "", E: validJWK.E},
		},
		{
			name: "missing exponent",
			jwk:  jwkKey{Kty: "RSA", N: validJWK.N, E: ""},
		},
		{
			name: "exponent overflow",
			jwk:  jwkKey{Kty: "RSA", N: validJWK.N, E: overflowE},
		},
		{
			name: "exponent equals 1",
			jwk:  jwkKey{Kty: "RSA", N: validJWK.N, E: base64.RawURLEncoding.EncodeToString([]byte{0x01})},
		},
		{
			name: "even exponent",
			jwk:  jwkKey{Kty: "RSA", N: validJWK.N, E: base64.RawURLEncoding.EncodeToString([]byte{0x02})},
		},
		{
			name: "modulus too small (<2048 bits)",
			jwk:  jwkKey{Kty: "RSA", N: base64.RawURLEncoding.EncodeToString(make([]byte, 128)), E: validJWK.E},
		},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			if _, err := parseRSAPublicKey(tc.jwk); err == nil {
				t.Fatalf("expected error for %s, got nil", tc.name)
			}
		})
	}
}

func TestParseECPublicKeyHardening(t *testing.T) {
	ecKey := generateECKeyPair(t)
	validJWK := ecPublicKeyToJWK("ec-1", &ecKey.PublicKey)

	if _, err := parseECPublicKey(validJWK); err != nil {
		t.Fatalf("expected valid P-256 EC JWK to succeed, got: %v", err)
	}

	shortCoord := base64.RawURLEncoding.EncodeToString(make([]byte, 31))
	longCoord := base64.RawURLEncoding.EncodeToString(make([]byte, 33))
	offCurveY := make([]byte, 32)
	offCurveY[31] = 1

	cases := []struct {
		name string
		jwk  jwkKey
	}{
		{
			name: "empty X",
			jwk:  jwkKey{Kty: "EC", Crv: "P-256", X: "", Y: validJWK.Y},
		},
		{
			name: "empty Y",
			jwk:  jwkKey{Kty: "EC", Crv: "P-256", X: validJWK.X, Y: ""},
		},
		{
			name: "short X coordinate",
			jwk:  jwkKey{Kty: "EC", Crv: "P-256", X: shortCoord, Y: validJWK.Y},
		},
		{
			name: "long Y coordinate",
			jwk:  jwkKey{Kty: "EC", Crv: "P-256", X: validJWK.X, Y: longCoord},
		},
		{
			name: "point not on curve",
			jwk:  jwkKey{Kty: "EC", Crv: "P-256", X: base64.RawURLEncoding.EncodeToString(make([]byte, 32)), Y: base64.RawURLEncoding.EncodeToString(offCurveY)},
		},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			if _, err := parseECPublicKey(tc.jwk); err == nil {
				t.Fatalf("expected error for %s, got nil", tc.name)
			}
		})
	}
}

func TestJWKSResponseSizeLimit(t *testing.T) {
	oversized := bytes.Repeat([]byte(" "), maxJWKSResponseBytes+10)
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write(oversized)
	}))
	defer srv.Close()

	client := NewJWKSClient(srv.URL)
	_, err := client.GetKey(context.Background(), "kid-1")
	if err == nil || !strings.Contains(err.Error(), "exceeds maximum allowed size") {
		t.Fatalf("expected oversized JWKS error, got: %v", err)
	}
}

func TestJWKAlgorithmCompatibility(t *testing.T) {
	ec256Key := generateECKeyPair(t)
	ec384Key, err := ecdsa.GenerateKey(elliptic.P384(), rand.Reader)
	if err != nil {
		t.Fatalf("generating P-384 key: %v", err)
	}
	rsaKey, err := rsa.GenerateKey(rand.Reader, 2048)
	if err != nil {
		t.Fatalf("generating RSA key: %v", err)
	}

	// JWK with mismatched metadata (EC P-256 claiming RS256) should be ignored on refresh.
	badMetaJWK := ecPublicKeyToJWK("bad-meta", &ec256Key.PublicKey)
	badMetaJWK.Alg = "RS256"

	// RSA JWK restricted to PS256 cannot verify an RS256 token.
	ps256JWK := rsaPublicKeyToJWK("rsa-ps256", "PS256", &rsaKey.PublicKey)

	// Valid RS256 JWK.
	rs256JWK := rsaPublicKeyToJWK("rsa-rs256", "RS256", &rsaKey.PublicKey)

	// Valid P-384 JWK (incompatible with ES256).
	p384JWK := ecPublicKeyToJWK("ec-384", &ec384Key.PublicKey)
	p384JWK.Crv = "P-384"
	p384JWK.Alg = "ES384"

	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(jwksDocument{
			Keys: []jwkKey{badMetaJWK, ps256JWK, rs256JWK, p384JWK},
		})
	}))
	defer srv.Close()

	verifier := NewSupabaseJWTVerifier(testIssuer, srv.URL)
	sub := uuid.New().String()

	// 1. EC P-256 token referencing bad-meta JWK (alg=RS256) must fail.
	tokBadMeta := signTestJWT(t, ec256Key, "bad-meta", baseClaims(sub, boolPtr(true)))
	if _, err := verifier.Verify(context.Background(), tokBadMeta); err == nil {
		t.Fatal("expected verification failure for JWK with mismatched alg metadata")
	}

	// 2. RS256 token referencing PS256-only JWK must fail.
	tokRS := jwt.NewWithClaims(jwt.SigningMethodRS256, baseClaims(sub, boolPtr(true)))
	tokRS.Header["kid"] = "rsa-ps256"
	signedPSMismatch, err := tokRS.SignedString(rsaKey)
	if err != nil {
		t.Fatalf("signing RSA JWT: %v", err)
	}
	if _, err := verifier.Verify(context.Background(), signedPSMismatch); err == nil {
		t.Fatal("expected verification failure when RS256 token uses PS256 JWK")
	}

	// 3. ES256 token referencing P-384 JWK must fail.
	tokWrongCurve := jwt.NewWithClaims(jwt.SigningMethodES256, baseClaims(sub, boolPtr(true)))
	tokWrongCurve.Header["kid"] = "ec-384"
	signedWrongCurve, err := tokWrongCurve.SignedString(ec256Key)
	if err != nil {
		t.Fatalf("signing ES256 JWT: %v", err)
	}
	if _, err := verifier.Verify(context.Background(), signedWrongCurve); err == nil {
		t.Fatal("expected verification failure when ES256 token uses P-384 JWK")
	}

	// 4. RS256 token referencing RS256 JWK must succeed.
	tokValidRS := jwt.NewWithClaims(jwt.SigningMethodRS256, baseClaims(sub, boolPtr(true)))
	tokValidRS.Header["kid"] = "rsa-rs256"
	signedValidRS, err := tokValidRS.SignedString(rsaKey)
	if err != nil {
		t.Fatalf("signing valid RS256 JWT: %v", err)
	}
	if _, err := verifier.Verify(context.Background(), signedValidRS); err != nil {
		t.Fatalf("expected valid RS256 token to verify, got: %v", err)
	}
}

func TestJWKSDuplicateKidRejected(t *testing.T) {
	keyA := generateECKeyPair(t)
	keyB := generateECKeyPair(t)
	uniqueKey := generateECKeyPair(t)

	dupA := ecPublicKeyToJWK("dup-kid", &keyA.PublicKey)
	dupB := ecPublicKeyToJWK("dup-kid", &keyB.PublicKey)
	valid := ecPublicKeyToJWK("unique-kid", &uniqueKey.PublicKey)

	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(jwksDocument{
			Keys: []jwkKey{dupA, dupB, valid},
		})
	}))
	defer srv.Close()

	verifier := NewSupabaseJWTVerifier(testIssuer, srv.URL)
	sub := uuid.New().String()

	// Neither key with the duplicate kid may be accepted.
	for _, k := range []*ecdsa.PrivateKey{keyA, keyB} {
		tok := signTestJWT(t, k, "dup-kid", baseClaims(sub, boolPtr(true)))
		if _, err := verifier.Verify(context.Background(), tok); err == nil {
			t.Fatal("expected verification failure for ambiguous duplicate kid")
		}
	}

	// Non-duplicate key in the same JWKS remains usable.
	tokValid := signTestJWT(t, uniqueKey, "unique-kid", baseClaims(sub, boolPtr(true)))
	if _, err := verifier.Verify(context.Background(), tokValid); err != nil {
		t.Fatalf("expected non-duplicate kid to verify, got: %v", err)
	}
}
