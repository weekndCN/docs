---
id: dst-root-ca-x3-expiration-september-2021
title: DST Root CA X3 交叉签名过期
---

## 问题描述

**2021年9月30** 日更新按计划，**DST Root CA X3** 交叉签名已过期，现在使用 **ISRG Root X1** 来信任几乎所有设备。

旧版浏览器和设备对 Let's Encrypt 证书的信任程度将略有变化。如果您运行一个典型的网站，您不会注意到任何区别 - 您的绝大多数访问者仍会接受您的 Let's Encrypt 证书。如果您提供 API 或必须支持 IoT 设备，则可能需要多注意更改。

Let's Encrypt 有一个名为 ISRG Root X1 的“根证书”。现代浏览器和设备信任您网站上安装的 Let's Encrypt 证书，因为它们在其根证书列表中包含 ISRG Root X1。为了确保我们颁发的证书在旧设备上可信，我们还有一个来自旧根证书的“交叉签名”：DST Root CA X3。

**DST Root CA X3** 将于 **2021年9月30日** 到期。这意味着那些不信任 **ISRG Root X1** 的旧设备在访问使用 `Let's Encrypt` 证书的站点时将开始收到证书警告。有一个重要的例外：不信任 ISRG Root X1 的旧 Android 设备将继续使用 Let's Encrypt，这要归功于来自 DST Root CA X3 的特殊交叉签名，该交叉签名超过了该根的到期时间。此异常仅适用于 Android。

