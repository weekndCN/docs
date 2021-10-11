---
title: NodeJS 9.6.1报告了Letencrypt颁发的域的过期证书
authors: weeknd
---

## 环境

| Name             | Version            |
| ---------------- | ------------------ |
| Node js          | v9.6.1             |
| Operation System | Debian GNU/Linux 8 |
| cURL             | curl 7.38.0        |

命令

```shell
root@dd61c0f5126c:~# cat /etc/issue
Debian GNU/Linux 8 \n \l

root@dd61c0f5126c:~# node -v
v9.6.1

root@dd61c0f5126c:~# curl --version
curl 7.38.0 (x86_64-pc-linux-gnu) libcurl/7.38.0 OpenSSL/1.0.1t zlib/1.2.8 libidn/1.29 libssh2/1.4.3 librtmp/2.3
Protocols: dict file ftp ftps gopher http https imap imaps ldap ldaps pop3 pop3s rtmp rtsp scp sftp smtp smtps telnet tftp
Features: AsynchDNS IDN IPv6 Largefile GSS-API SPNEGO NTLM NTLM_WB SSL libz TLS-SRP
```

## **issue** 描述

日常运行的node服务端，无法正常调用公司内部https服务。公司服务都使用let‘s encrypt签发的证书！


## 问题重现

### 使用 **CURL** 命令请求https服务

- 服务端发起请求

```shell
root@dd61c0f5126c: curl -v https://demo.wukongbox.co
* Rebuilt URL to: https://demo.wukongbox.co/
* Hostname was NOT found in DNS cache
*   Trying 43.247.90.138...
* Connected to demo.wukongbox.co (43.247.90.138) port 443 (#0)
* successfully set certificate verify locations:
*   CAfile: none
  CApath: /etc/ssl/certs
* SSLv3, TLS handshake, Client hello (1):
* SSLv3, TLS handshake, Server hello (2):
* SSLv3, TLS handshake, CERT (11):
* SSLv3, TLS alert, Server hello (2):
* SSL certificate problem: certificate has expired
* Closing connection 0
* SSLv3, TLS alert, Client hello (1):
curl: (60) SSL certificate problem: certificate has expired
```
>  Note: CApath: /etc/ssl/certs

- 本地发起请求

```shell
# 本地请求正常
bash-3.2$ curl https://demo.xxx.co
<html>
<head><title>301 Moved Permanently</title></head>
<body>
<center><h1>301 Moved Permanently</h1></center>
<hr><center>nginx</center>
</body>
</html>

# curl 版本
bash-3.2$ curl --version
curl 7.64.1 (x86_64-apple-darwin19.0) libcurl/7.64.1 (SecureTransport) LibreSSL/2.8.3 zlib/1.2.11 nghttp2/1.39.2
Release-Date: 2019-03-27
Protocols: dict file ftp ftps gopher http https imap imaps ldap ldaps pop3 pop3s rtsp smb smbs smtp smtps telnet tftp
Features: AsynchDNS GSS-API HTTP2 HTTPS-proxy IPv6 Kerberos Largefile libz MultiSSL NTLM NTLM_WB SPNEGO SSL UnixSockets
```

> curl performs SSL certificate verification by default, using a "bundle"
>  of Certificate Authority (CA) public keys (CA certs). If the default
>  bundle file isn't adequate, you can specify an alternate file
>  using the --cacert option.

### 使用 **node https模块** 请求https服务

- 服务端构造一个https请求文件

```javascript
cat << EOF >/tmp/test.js

const https = require('https')
const querystring = require('querystring')


var postData = querystring.stringify({
  phone: "13512345678",
});

const options = {
  hostname: 'demo.xxx.co',
  port: 443,
  path: '/xxx.api',
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Content-Length': postData.length,
  },
}

var req = https.request(options, function (res) {
  var result = '';
  res.on('data', function (chunk) {
    result += chunk;
  });
  res.on('end', function () {
    console.log(result);
  });
  res.on('error', function (err) {
    console.log(err);
  })
});
 
req.on('error', function (err) {
  console.log(err);
});
 
req.write(postData);
req.end();
EOF
```

- 服务端发起请求
  
```shell
root@dd61c0f5126c:~# node /tmp/test.js
{ Error: certificate has expired
    at TLSSocket.onConnectSecure (_tls_wrap.js:1036:34)
    at TLSSocket.emit (events.js:127:13)
    at TLSSocket._finishInit (_tls_wrap.js:633:8) code: 'CERT_HAS_EXPIRED' }
```

Error: certificate has expired



## 分析问题

```
root@dd61c0f5126c:~# echo|openssl s_client -servername demo.wukongbox.co -connect demo.wukongbox.co:443 2>/dev/null 

CONNECTED(00000003)
---
Certificate chain
 0 s:/CN=demo.wukongbox.co
   i:/C=US/O=Let's Encrypt/CN=R3
 1 s:/C=US/O=Let's Encrypt/CN=R3
   i:/C=US/O=Internet Security Research Group/CN=ISRG Root X1
 2 s:/C=US/O=Internet Security Research Group/CN=ISRG Root X1
   i:/O=Digital Signature Trust Co./CN=DST Root CA X3
..........
    Start Time: 1633939284
    Timeout   : 300 (sec)
    Verify return code: 10 (certificate has expired)
```

证书链里有两个 **ISRG Root X1** 和 **DST Root CA X3**

检查CA证书有效期

```shell
root@dd61c0f5126c:/etc/ssl/certs# pwd
/etc/ssl/certs

root@dd61c0f5126c:/etc/ssl/certs# cat DST_Root_CA_X3.pem|openssl x509 -noout -dates
notBefore=Sep 30 21:12:19 2000 GMT
notAfter=Sep 30 14:01:15 2021 GMT

root@dd61c0f5126c:/etc/ssl/certs# cat ISRG_Root_X1.pem|openssl x509 -noout -dates
notBefore=Jun  4 11:04:38 2015 GMT
notAfter=Jun  4 11:04:38 2035 GMT
```

**DST_Root_CA_X3.pem** 已经过期。更多查看[DST Root CA X3 Expired](http://localhost:3000/docs/letsencrypt/dst-root-ca-x3-expiration-september-2021)

## 解决问题

### 修复curl无法请求letencrypt的https请求
根据文档描述。现在已经可以使用ISRG Root X1的CA证书。禁用DST_Root_CA_X3.pem然后更新证书
```shell
# disable 
root@dd61c0f5126c:/etc/ssl/certs# sed -i '/^mozilla\/DST_Root_CA_X3/s/^/!/' /etc/ca-certificates.conf
root@dd61c0f5126c:/etc/ssl/certs# grep X3 /etc/ca-certificates.conf
!mozilla/DST_Root_CA_X3.crt

# update
root@dd61c0f5126c:/etc/ssl/certs# update-ca-certificates -f
Clearing symlinks in /etc/ssl/certs...done.
Updating certificates in /etc/ssl/certs... 173 added, 0 removed; done.
Running hooks in /etc/ca-certificates/update.d....done.

# check
root@dd61c0f5126c:/etc/ssl/certs# ls DST_Root_CA_X3.pem
ls: cannot access DST_Root_CA_X3.pem: No such file or directory
```

再次尝试请求

```shell

root@dd61c0f5126c:~# curl -v https://demo.wukongbox.co
* Rebuilt URL to: https://demo.wukongbox.co/
* Hostname was NOT found in DNS cache
*   Trying 43.247.90.138...
* Connected to demo.wukongbox.co (43.247.90.138) port 443 (#0)
* successfully set certificate verify locations:
*   CAfile: none
  CApath: /etc/ssl/certs
* SSLv3, TLS handshake, Client hello (1):
* SSLv3, TLS handshake, Server hello (2):
* SSLv3, TLS handshake, CERT (11):
* SSLv3, TLS handshake, Server key exchange (12):
* SSLv3, TLS handshake, Server finished (14):
* SSLv3, TLS handshake, Client key exchange (16):
* SSLv3, TLS change cipher, Client hello (1):
* SSLv3, TLS handshake, Finished (20):
* SSLv3, TLS change cipher, Client hello (1):
* SSLv3, TLS handshake, Finished (20):
* SSL connection using TLSv1.2 / ECDHE-RSA-AES256-GCM-SHA384
* Server certificate:
* 	 subject: CN=demo.wukongbox.co
* 	 start date: 2021-09-17 07:41:20 GMT
* 	 expire date: 2021-12-16 07:41:19 GMT
* 	 subjectAltName: demo.wukongbox.co matched
* 	 issuer: C=US; O=Let's Encrypt; CN=R3
* 	 SSL certificate verify ok.

```

### 修复NodeJS无法请求letencrypt的https请求
执行test.js文件
```shell

# failed
root@dd61c0f5126c:~# node /tmp/test.js
{ Error: certificate has expired
    at TLSSocket.onConnectSecure (_tls_wrap.js:1036:34)
    at TLSSocket.emit (events.js:127:13)
    at TLSSocket._finishInit (_tls_wrap.js:633:8) code: 'CERT_HAS_EXPIRED' }

```

> nodejs不是读取libcurl的certs证书。所以依然失败



NodeJS的Root CA Certs绑定在source code里。查看[node_root_certs.h](https://github.com/nodejs/node/blob/v9.6.1/src/node_root_certs.h)

``` 
# 截取源代码
root@dd61c0f5126c:~# cat << EOF > /tmp/dst.pem
> -----BEGIN CERTIFICATE-----
> MIIDSjCCAjKgAwIBAgIQRK+wgNajJ7qJMDmGLvhAazANBgkqhkiG9w0BAQUFADA/MSQwIgYD
> VQQKExtEaWdpdGFsIFNpZ25hdHVyZSBUcnVzdCBDby4xFzAVBgNVBAMTDkRTVCBSb290IENB
> IFgzMB4XDTAwMDkzMDIxMTIxOVoXDTIxMDkzMDE0MDExNVowPzEkMCIGA1UEChMbRGlnaXRh
> bCBTaWduYXR1cmUgVHJ1c3QgQ28uMRcwFQYDVQQDEw5EU1QgUm9vdCBDQSBYMzCCASIwDQYJ
> KoZIhvcNAQEBBQADggEPADCCAQoCggEBAN+v6ZdQCINXtMxiZfaQguzH0yxrMMpb7NnDfcdA
> wRgUi+DoM3ZJKuM/IUmTrE4Orz5Iy2Xu/NMhD2XSKtkyj4zl93ewEnu1lcCJo6m67XMuegwG
> MoOifooUMM0RoOEqOLl5CjH9UL2AZd+3UWODyOKIYepLYYHsUmu5ouJLGiifSKOeDNoJjj4X
> Lh7dIN9bxiqKqy69cK3FCxolkHRyxXtqqzTWMIn/5WgTe1QLyNau7Fqckh49ZLOMxt+/yUFw
> 7BZy1SbsOFU5Q9D8/RhcQPGX69Wam40dutolucbY38EVAjqr2m7xPi71XAicPNaDaeQQmxkq
> tilX4+U9m5/wAl0CAwEAAaNCMEAwDwYDVR0TAQH/BAUwAwEB/zAOBgNVHQ8BAf8EBAMCAQYw
> HQYDVR0OBBYEFMSnsaR7LHH62+FLkHX/xBVghYkQMA0GCSqGSIb3DQEBBQUAA4IBAQCjGiyb
> FwBcqR7uKGY3Or+Dxz9LwwmglSBd49lZRNI+DT69ikugdB/OEIKcdBodfpga3csTS7MgROSR
> 6cz8faXbauX+5v3gTt23ADq1cEmv8uXrAvHRAosZy5Q6XkjEGB5YGV8eAlrwDPGxrancWYaL
> bumR9YbK+rlmM6pZW87ipxZzR8srzJmwN0jP41ZL9c8PDHIyh8bwRLtTcm1D9SZImlJnt1ir
> /md2cXjbDaJWFBM5JDGFoqgCWjBH4d1QB7wCCZAA62RjYJsWvIjJEubSfZGL+T0yjWW06Xyx
> V3bqxbYoOb8VZRzI9neWagqNdwvYkQsEjgfbKbYK7p2CNTUQ
> -----END CERTIFICATE-----
> EOF

# 校验日期
root@dd61c0f5126c:~# cat /tmp/dst.pem|openssl x509 -noout -dates
notBefore=Sep 30 21:12:19 2000 GMT
notAfter=Sep 30 14:01:15 2021 GMT
```

由于nodejs是嵌入源代码里的。这里有如下解决的方案

- 方案一（danger）

禁止TLS REJECT为0(无需修改代码)
```shell
root@dd61c0f5126c:~# export NODE_TLS_REJECT_UNAUTHORIZED='0'
root@dd61c0f5126c:~# node /tmp/test.js
{"btnlist":null,"code":"success","msg":"更新成功","value":"xxxx"}
```

- 方案二（less danger）

特定的request设置`strictSSL: false`(需要hardcode request代码)


- 方案三(safe)

启动node时，指定参数为openssl certs

```
root@dd61c0f5126c:~# node --use-openssl-ca /tmp/test.js
{"btnlist":null,"code":"success","msg":"更新成功","value":"xxxx"}
```

- 方案四(recommand)

升级到NodeJS修复的版本

## 总结

NodeJS和openssl没有共享ca certs文件。nodejs默认的root CA证书编译在源代码内。如果需要共享ca文件。可以通过flag `--use-openssl-ca` 来告诉node服务端加载openssl的ca证书。而不是hardcode的证书。**额外注意的是：** 使用`NODE_EXTRA_CA_CERTS`可以指定外部的证书。但是他无法改变源代码内的**第三方权威Root CA**。`NODE_EXTRA_CA_CERTS`适合不存在源代码内或者自定义CA证书的情况
