---
title: "Daily AlpacaHack: Wither Writeup"
description: "Statistical recovery and law of large numbers, isn't that a bit overkill?"
pubDate: 2026-04-14
tags: ["AlpacaHack", "Crypto", "Writeup", "AND"]
---

This time in Daily AlpacaHack, we are given a "cipher" in which each bit of the plaintext is ANDed with a cryptographically secure pseudorandomly generated key `os.urandom()` by using the `secrets` module. We are also given an arbitrary number of oracle queries for the encrypted flag.

# Recovery

We can exploit the fact that the output probabilities of AND are not balanced, unlike what happens with XOR. Let us look at a single bit.

Let:

- $N$: be the total number of bits in the plaintext
- $M$: be the total number of samples (oracle queries)
- $p_n$: the $n$-th plaintext bit
- $k_n$: the $n$-th key bit
- $y_n$: the $n$-th ciphertext bit

We then have the following truth table for bit $n$:

$$
\begin{array}{cc|c}
p_n & k_n & y_n \\
\hline
0 & 0 & 0 \\
0 & 1 & 0 \\
1 & 0 & 0 \\
1 & 1 & 1
\end{array}
$$

Thanks to the law of large numbers, for a large enough sample size we can assure:

$$
P(y_n = 0 \mid p_n = 0) = 1
$$

$$
P(y_n = 1 \mid p_n = 1) = 0.5
$$

This means that all $0$ bits in the ciphertext correspond to a $0$ bit in the plaintext, and, with a large enough sample size, all $1$ bits in the plaintext will have a $P(y_n = 1 \mid p_n = 1) \approx 0.5$ chance of being observed as $1$ in the ciphertext at least once.

Thus we can recover the plaintext by checking the frequency of $1$ bits over the sample size.

$$ P(p_n = 1) = \frac{\sum_{i=1}^{M} [y_{n}^{(i)} = 1]}{M} $$

For a large enough $M$, we expect all $0$ bits in the plaintext to have $P(p_n = 1) = 0$, while all $1$ bits in the plaintext will have $P(p_n = 1) \approx 0.5$ or at least $P(p_n = 1) > 0$.

## How many samples are required?

To determine how many samples we need to be confident in our recovery we need to model the probability of observing at least one $1$ in the ciphertext for a given plaintext bit that is $1$. After performing a single oracle query, we can obtain the size of the ciphertext:

```text
40603001020111026400040532605973027040606532204a48414368140f00122000206024190050410c682044402e414b4041006510201640542015
```

In this case the ciphertext is 60 bytes long, so we need to find the number of sample $M $ such that we can be confident (With a 95% confidence level in this case) that we have observed at least one $1$ in the ciphertext for all plaintext bits that are $1$.

We can do so by modeling the probability of observing at least one $1$ in the ciphertext for a given plaintext bit that is $1$ as a geometric distribution, where the probability of success (observing a $1$) is $0.5$ for each sample:


The ciphertext is 60 bytes long, so the flag length is:

$$
60 \text{ bytes} \times 8 = 480 \text{ bits}
$$

For each plaintext bit that is $1$, the probability that it remains $0$ in all $n$ ciphertext samples is:

$$
2^{-n}
$$

So the probability that a given plaintext 1-bit is observed at least once after $n$ samples is:

$$
1 - 2^{-n}
$$

In the worst case, all 480 plaintext bits are 1, so to recover the entire plaintext with at least 95% confidence, we require:

$$
(1 - 2^{-n})^{480} \ge 0.95
$$

Evaluating this:

- $n = 13$ gives approximately $0.943$ overall confidence
- $n = 14$ gives approximately $0.971$ overall confidence

Therefore, 14 samples are enough to exceed 95% confidence in the worst case.
