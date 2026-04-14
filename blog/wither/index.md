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

Thus we can recover the plaintext by estimating the empirical frequency of $1$ values at each bit position:

$$
\hat{q}_n = \frac{1}{M} \sum_{i=1}^{M} [y_n^{(i)} = 1]
$$

Then we infer the plaintext bit as:

$$
p_n =
\begin{cases}
1 & \text{if } \hat{q}_n > 0 \\
0 & \text{if } \hat{q}_n = 0
\end{cases}
$$

For a large enough $M$, we expect all $0$ bits in the plaintext to have $\hat{q}_n = 0$, while all $1$ bits in the plaintext will have $\hat{q}_n \approx 0.5$ or at least $\hat{q}_n > 0$.

## How many samples are required?

To determine how many samples we need to be confident in our recovery, we first need to model the probability of observing at least one $1$ in the ciphertext for a plaintext bit that is equal to $1$. After performing a single oracle query, we can obtain the size of the ciphertext:

```text
40603001020111026400040532605973027040606532204a48414368140f00122000206024190050410c682044402e414b4041006510201640542015
```

In this case the ciphertext is 60 bytes long, so the flag length is:

$$
60 \text{ bytes} \times 8 = 480 \text{ bits}
$$

Now let $K$ be the number of plaintext bits equal to $1$. For a single such bit, each oracle query reveals a ciphertext bit equal to $1$ with probability $0.5$, so the probability that this bit is never observed as $1$ after $n$ samples is:

$$
2^{-n}
$$

Therefore, the probability that this bit is recovered after $n$ samples is:

$$
\Pr(T_1 \le n) = 1 - 2^{-n}
$$

Assuming independence across bit positions, the probability that all $K$ plaintext 1-bits have been recovered after $n$ samples is:

$$
\Pr(T_K \le n) = \left(1 - 2^{-n}\right)^K
$$

Now we consider the worst-case scenario, where the whole bitstream is composed of $1$ bits. Since the ciphertext has length 480 bits, this means:

$$
K = 480
$$

If we target confidence level $q = 0.95$, then we need:

$$
\Pr(T_{480} \le n) = \left(1 - 2^{-n}\right)^{480} \ge q = 0.95
$$

Evaluating this:

- $n = 13$ gives approximately $0.943$ overall confidence
- $n = 14$ gives approximately $0.971$ overall confidence

This means that with 14 samples we can be 97.1% confident that we have recovered all bits of the plaintext, even in the worst-case scenario where all bits are $1$. For an average case, where we expect a lot more $0$ bits, we can be confident with even fewer samples. But as each oracle query is very cheap, we can just go with 14 samples to be safe.

# Solver

The solver was implemented in Python, using the `pwntools` library to perform the remote retrieval of the ciphertexts. 

First we need to recollect the $M$ samples of the ciphertexts, to do that we first define a `extract_ciphertext_from_line(line)`

```python
def extract_ciphertext_from_line(line):
    prefix = b"Press Enter to get the encrypted flag...Encrypted flag: "
    if not line.startswith(prefix):
        raise ValueError("Line does not contain expected prefix.")
    
    hex_str = line[len(prefix):].strip()
    return bytes.fromhex(hex_str.decode())
```

This function simply extracts the ciphertext from the raw line of output from the netcat instance, removing the prefix and converting the hexadecimal string to bytes.

Now we define the function that performs the recovery `get_flag(samples, num_samples)`

```python
def get_flag(samples, num_samples):
    if num_samples == 0:
        return b""

    flag_length = len(samples[0])
    estimated_flag = bytearray(flag_length)

    for byte_index in range(flag_length):
        for bit_index in range(8):
            ones = sum((sample[byte_index] >> bit_index) & 1 for sample in samples)
            probability = ones / num_samples
            if probability > 0:
                estimated_flag[byte_index] |= 1 << bit_index
    return bytes(estimated_flag)
```

Here we iterate over each byte and bit position, estimating $\hat{q}_n$ for each plaintext bit. If we observe at least one $1$ bit, then $\hat{q}_n > 0$ and we set the corresponding plaintext bit to $1$; otherwise we leave it as $0$.

Finally, we define the main logic in `solve_remote()`, which initializes the connection using `pwntools`, retrieves the ciphertexts until we have enough samples, and then recovers and prints the flag.

```python
def solve_remote():
    r = pwn.remote(REMOTE_HOST, REMOTE_PORT)
    ciphers = []
    i = 0

    for _ in range(MAX_SAMPLES):
        print(f"Collecting samples... [i = {i}]")
        r.sendline(b"")  # Press Enter
        line = r.recvline(timeout=5)
        if not line:
            raise SystemExit("No data received...")
        try:
            cipher_bytes = extract_ciphertext_from_line(line)
        except ValueError:
            # If the text is split between 2 lines
            extra = r.recvline(timeout=2)
            if not extra:
                raise
            line = line + extra
            cipher_bytes = extract_ciphertext_from_line(line)
        
        if i >= MAX_SAMPLES:
            raise SystemExit("Exceeded maximum sample limit without meeting stopping condition.")

        ciphers.append(cipher_bytes)
        i += 1
    
    print(f"Collected {i} samples.")
    flag = get_flag(ciphers, i)

    try:
        print(f"Recovered flag: {flag.decode()}")
    except UnicodeDecodeError:
        print(f"Recovered flag (hex): {flag.hex()}")

if __name__ == "__main__":
    solve_remote()
```

This is almost a line per line copy of the solver we used for Bloom, with the only difference being that now we use a fixed iterator (`for _ in range(MAX_SAMPLES)`) instead of a `while True` loop with a stopping condition. In here we simply connect to the remote service, collect the ciphertexts (and parse them with `extract_ciphertext_from_line`) until we have collected `MAX_SAMPLES` samples, and then we call `get_flag` to recover the plaintext and print it.

# Results

After running the solver, we were able to successfully recover the flag with 14 samples, which is exactly what we expected from our theoretical analysis. 

The final output with the recovered flag was:

```log
$ python solver.py
[+] Opening connection to 34.170.146.252 on port 29127: Done
Collecting samples... [i = 0]
Collecting samples... [i = 1]
Collecting samples... [i = 2]
Collecting samples... [i = 3]
Collecting samples... [i = 4]
Collecting samples... [i = 5]
Collecting samples... [i = 6]
Collecting samples... [i = 7]
Collecting samples... [i = 8]
Collecting samples... [i = 9]
Collecting samples... [i = 10]
Collecting samples... [i = 11]
Collecting samples... [i = 12]
Collecting samples... [i = 13]
Collected 14 samples.
Recovered flag: Alpaca{Bebe_skyscraper,_night_draper,_I_inhaling_vapor,_huh}
[*] Closed connection to 34.170.146.252 port 29127
```
# Conclusion

In comparison to bloom, which I consider similar in the sense that both relied on bitwise operations as the basis of the "encryption", this challenge allowed for a much easier recovery, mostly because of the heavy unbalance the AND operation has in its output probabilities. In Bloom, the imbalance was much more subtle and introduced by leaving out the 0 key, which made recovering enough samples to be able to distinguish the plaintext bits much more difficult. In Wither, the imbalance is very strong and allows for a very easy recovery with a very small number of samples, which is what we expected from our theoretical analysis.

I'm pretty sure this is not the "intended" framing for the solution, as while I was writing this post I realized you could simply OR each bit on the ciphertext samples and get the plaintext directly, but if you think about it this is the same thing with some extra steps in between (LOL).

# Greetings

As always thanks to the AlpacaHack team for designing and hosting these daily challenges, as always they are a lot of fun and a great less competitive way to keep doing CTF style challenges. Also thanks to kanon for creating this interesting challenge, it was a fun exercise to solve as always!
