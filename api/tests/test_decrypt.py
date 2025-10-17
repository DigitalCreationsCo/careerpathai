import os
import hashlib
import hmac
import json
import base64
from cryptography.hazmat.primitives.kdf.hkdf import HKDF
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.backends import default_backend

# Your values
AUTH_SECRET = "e89cd4dd3bc84d402a5d7823b940291fb80aa831f2f6087b68263fbe1f1dde5d"
TOKEN = "eyJhbGciOiJkaXIiLCJlbmMiOiJBMjU2Q0JDLUhTNTEyIiwia2lkIjoiczBqVUw3TGRxQmNicFZvaUJWZVJSZmFuTThyV29IUlNmWV9WTG5WS25HS0FJdFM5aDNRLXNXc3JQazF0MDJ3MTUxWnp4RzhycDV1WDEtbWJWUS1ydXcifQ..NBbYwU3Mbdp3WYFc_YoxGQ.F8DWFVsYCH4JZG3NFgkLpwdwXFJbfSiSsZ3dL0nNvOux1WLDSAyBHeINYVQpw1E_eBU2yUTMlQs10SP_yvxh9Dj7mvYMiVJj3nZ1b_iQNvt0g5s_kz2cu7ah4uwJWoDu9E-0M6dUcWOkORQqWA-qHtiT5bxaUplhNxUFICI9H5gA0GioBK5S2pg7LOHY-6DTQ3oRpebsP9SPbxi7Jgs4vaTy6PQqVZwvy8t9-KJAlGvJgrQxOIjhWtocl344tioIk3EkKVgyFWIEWjuQTYMmdls1MPy5Z6Kt55n6gtgcE4xiRj4EdmCxWq57WgKhdRsPv8ixBYEcrTMRSbCEoXOpJ-uuOcp8w89g3cdjqHztX-FpFznIEke6jzhk5GZE1MnjZkazeCpda36zzJ4stE-_9Q.AGG5C96CilMPszCNEotTj4P-RO8BPtuuqAQHrWkLgDk"

def base64url_decode(data):
    padding = 4 - (len(data) % 4)
    if padding != 4:
        data += '=' * padding
    return base64.urlsafe_b64decode(data)

# Parse token
parts = TOKEN.split('.')
header_b64, _, iv_b64, ct_b64, tag_b64 = parts

# Decode
aad = header_b64.encode('ascii')
iv = base64url_decode(iv_b64)
ciphertext = base64url_decode(ct_b64)
expected_tag = base64url_decode(tag_b64)

print(f"AAD length: {len(aad)}")
print(f"IV length: {len(iv)}")
print(f"Ciphertext length: {len(ciphertext)}")
print(f"Expected tag: {expected_tag.hex()}")

# Try different key derivations
secret_bytes = bytes.fromhex(AUTH_SECRET)
print(f"\nSecret bytes length: {len(secret_bytes)}")


import os
import hashlib
import hmac
import json
import base64
from cryptography.hazmat.primitives.kdf.hkdf import HKDF
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.backends import default_backend

AUTH_SECRET = "e89cd4dd3bc84d402a5d7823b940291fb80aa831f2f6087b68263fbe1f1dde5d"
TOKEN = "eyJhbGciOiJkaXIiLCJlbmMiOiJBMjU2Q0JDLUhTNTEyIiwia2lkIjoiczBqVUw3TGRxQmNicFZvaUJWZVJSZmFuTThyV29IUlNmWV9WTG5WS25HS0FJdFM5aDNRLXNXc3JQazF0MDJ3MTUxWnp4RzhycDV1WDEtbWJWUS1ydXcifQ..NBbYwU3Mbdp3WYFc_YoxGQ.F8DWFVsYCH4JZG3NFgkLpwdwXFJbfSiSsZ3dL0nNvOux1WLDSAyBHeINYVQpw1E_eBU2yUTMlQs10SP_yvxh9Dj7mvYMiVJj3nZ1b_iQNvt0g5s_kz2cu7ah4uwJWoDu9E-0M6dUcWOkORQqWA-qHtiT5bxaUplhNxUFICI9H5gA0GioBK5S2pg7LOHY-6DTQ3oRpebsP9SPbxi7Jgs4vaTy6PQqVZwvy8t9-KJAlGvJgrQxOIjhWtocl344tioIk3EkKVgyFWIEWjuQTYMmdls1MPy5Z6Kt55n6gtgcE4xiRj4EdmCxWq57WgKhdRsPv8ixBYEcrTMRSbCEoXOpJ-uuOcp8w89g3cdjqHztX-FpFznIEke6jzhk5GZE1MnjZkazeCpda36zzJ4stE-_9Q.AGG5C96CilMPszCNEotTj4P-RO8BPtuuqAQHrWkLgDk"

def base64url_decode(data):
    padding = 4 - (len(data) % 4)
    if padding != 4:
        data += '=' * padding
    return base64.urlsafe_b64decode(data)

# Parse token
parts = TOKEN.split('.')
header_b64, _, iv_b64, ct_b64, tag_b64 = parts

# Decode header to get kid
header = json.loads(base64url_decode(header_b64))
kid = header.get('kid')
print(f"KID from header: {kid}")

# Decode components
aad = header_b64.encode('ascii')
iv = base64url_decode(iv_b64)
ciphertext = base64url_decode(ct_b64)
expected_tag = base64url_decode(tag_b64)

print(f"\nExpected tag: {expected_tag.hex()}")

secret_bytes = bytes.fromhex(AUTH_SECRET)
# Method 1: HKDF with NextAuth.js info
print("\n=== Method 1: HKDF with NextAuth info ===")
derived = HKDF(
    algorithm=hashes.SHA256(),
    length=64,
    salt=None,
    info=b"NextAuth.js Generated Encryption Key",
    backend=default_backend()
).derive(secret_bytes)
mac_key1 = derived[:32]
enc_key1 = derived[32:64]
print(f"MAC key: {mac_key1.hex()[:32]}...")
print(f"ENC key: {enc_key1.hex()[:32]}...")

# Compute HMAC
al = len(aad) * 8
al_bytes = al.to_bytes(8, byteorder='big')
mac_input = aad + iv + ciphertext + al_bytes
computed_mac = hmac.new(mac_key1, mac_input, hashlib.sha512).digest()
computed_tag1 = computed_mac[:32]
print(f"Computed tag: {computed_tag1.hex()}")
print(f"Match: {computed_tag1 == expected_tag}")

# Method 2: Direct secret (no HKDF)
print("\n=== Method 2: Direct secret (repeated to 64 bytes) ===")
full_key = secret_bytes + secret_bytes
mac_key2 = full_key[:32]
enc_key2 = full_key[32:64]
computed_mac2 = hmac.new(mac_key2, mac_input, hashlib.sha512).digest()
computed_tag2 = computed_mac2[:32]
print(f"Computed tag: {computed_tag2.hex()}")
print(f"Match: {computed_tag2 == expected_tag}")

# Method 3: HKDF without info parameter
print("\n=== Method 3: HKDF without info ===")
derived3 = HKDF(
    algorithm=hashes.SHA256(),
    length=64,
    salt=None,
    info=b"",
    backend=default_backend()
).derive(secret_bytes)
mac_key3 = derived3[:32]
enc_key3 = derived3[32:64]
computed_mac3 = hmac.new(mac_key3, mac_input, hashlib.sha512).digest()
computed_tag3 = computed_mac3[:32]
print(f"Computed tag: {computed_tag3.hex()}")
print(f"Match: {computed_tag3 == expected_tag}")

# Method 4: HKDF with different info
print("\n=== Method 4: HKDF with empty info ===")
derived4 = HKDF(
    algorithm=hashes.SHA256(),
    length=64,
    salt=b"",
    info=b"",
    backend=default_backend()
).derive(secret_bytes)
mac_key4 = derived4[:32]
enc_key4 = derived4[32:64]
computed_mac4 = hmac.new(mac_key4, mac_input, hashlib.sha512).digest()
computed_tag4 = computed_mac4[:32]
print(f"Computed tag: {computed_tag4.hex()}")
print(f"Match: {computed_tag4 == expected_tag}")

# Method 5: Use KID as the actual key (decode it)
print("\n=== Method 5: KID is the key ===")
try:
    kid_bytes = base64url_decode(kid)
    print(f"KID decoded length: {len(kid_bytes)} bytes")
    if len(kid_bytes) == 64:
        mac_key5 = kid_bytes[:32]
        enc_key5 = kid_bytes[32:64]
        
        al = len(aad) * 8
        al_bytes = al.to_bytes(8, byteorder='big')
        mac_input = aad + iv + ciphertext + al_bytes
        
        computed_mac5 = hmac.new(mac_key5, mac_input, hashlib.sha512).digest()
        computed_tag5 = computed_mac5[:32]
        print(f"Computed tag: {computed_tag5.hex()}")
        print(f"Match: {computed_tag5 == expected_tag}")
        
        if computed_tag5 == expected_tag:
            print("\n✓✓✓ SUCCESS! The KID is the actual encryption key!")
            print("NextAuth is storing the derived key in the KID field.")
except Exception as e:
    print(f"Failed: {e}")

# Method 6: HKDF with kid as info
print("\n=== Method 6: HKDF with kid as info parameter ===")
try:
    derived6 = HKDF(
        algorithm=hashes.SHA256(),
        length=64,
        salt=None,
        info=kid.encode('utf-8'),
        backend=default_backend()
    ).derive(secret_bytes)
    mac_key6 = derived6[:32]
    
    al = len(aad) * 8
    al_bytes = al.to_bytes(8, byteorder='big')
    mac_input = aad + iv + ciphertext + al_bytes
    
    computed_mac6 = hmac.new(mac_key6, mac_input, hashlib.sha512).digest()
    computed_tag6 = computed_mac6[:32]
    print(f"Computed tag: {computed_tag6.hex()}")
    print(f"Match: {computed_tag6 == expected_tag}")
except Exception as e:
    print(f"Failed: {e}")