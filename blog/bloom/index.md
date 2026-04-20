---
title: "Daily AlpacaHack: Bloom Writeup"
description: "How does a single number convert a perfect secrecy encryption scheme into a completely insecure one?"
pubDate: 2026-03-24
tags: ["alpacahack", "crypto", "xor", "one-time-pad"]
---

Daily AlpacaHack - Bloom presents us with a One-Time Pad encryption scheme where every byte of the plaintext is XORed with a cryptographically secure random byte (generated from os.urandom using the secrets Python module). This makes any frequency or PRNG state recovery attacks unfeasible.

In the end, the solution path came from the realization that the random values were not defined in the range ((0 \ldots n)) but in the range ((1 \ldots n)), so the key could never be ((0)). We also need to remember the property of XOR for a key ((Key = 0))

[
Plaintext \oplus 0 = Plaintext
]

This means we know that the only impossible value for the cipher is the plaintext itself.

# Recovery

Let's suppose a ((4))-bit ((2))-block reduced system. The following would be a valid encryption:

[
\begin{aligned}
1\ 0\ 0\ 1\ &\rightarrow\ flag \\
1\ 1\ 0\ 0\ &\rightarrow\ key \\
\hline
0\ 1\ 0\ 1\ &\rightarrow\ cipher \\
\end{aligned}
]


But this would **not** be valid:

[
\begin{aligned}
1\ 0\ 0\ 1\ &\rightarrow\ flag \\
0\ 0\ 0\ 0\ &\rightarrow\ key \\
\hline
1\ 0\ 0\ 1\ &\rightarrow\ cipher \\
\end{aligned}
]

So, for example, for the plaintext 1001, we can collect all 15 states:

[
\{0000, 0001, 0010, 0011, 0100, 0101, 0110, 0111, 1000, 1010, 1011, 1100, 1101, 1110, 1111\}
]

but never ((1001)).

Therefore, if we sample the 15 unique states, then we can deduce the plaintext. This same principle can be applied to this challenge, but this time we need to sample 255 states for each byte.

# Feasibility

To measure the feasibility of this attack, we can model the recovery of each byte as a coupon collector problem.

For each byte, we must sample ((255)) unique states (all possible ciphertext values except the plaintext byte) to deduce the plaintext byte. This condition must be satisfied for all bytes in the plaintext.

For a single byte position, we can consider the probability of collecting ((T_1)) unique states after ((n)) rounds, which can be expressed as:

[
\Pr(T_1 \le n) \approx e^{-e^{-(n/255-\ln 255)}}
]

Assuming the byte positions behave independently, the probability that all bytes have been recovered after ((n)) rounds is:

[
\Pr(T_m \le n) \approx \left(\Pr(T_1 \le n)\right)^m
]

Solving this for a target probability ((q)), we can obtain the approximate number of rounds needed for ((m)) bytes:

[
n_q \approx 255\left(\ln 255 + \ln\!\left(\frac{m}{-\ln q}\right)\right)
]

For example, with ((m=69)) and ((q=0.505)), this gives ((2586)) samples in the median case, which is feasible within the constraints of the challenge.

# Solver

The solver was implemented in Python, using the `pwntools` library to perform the remote retrieval of the ciphertexts and `numpy` to handle more efficiently the sampling and counting of the unique states for each byte position.

```python
def stop(ciphers: np.ndarray, sample_count: int) -> bool: 
    # Check whether each byte has 255 unique samples (so the required condition is satisfied and we can recover the flag)
    if sample_count <= 0:
        return False
    collected = ciphers[:sample_count]
    unique_counts = np.array([np.unique(col).size for col in collected.T], dtype=np.int32)
    return np.all(unique_counts >= 255)
```

We define a `stop(ciphers: np.ndarray, sample_count: int) -> bool` function that checks if the required condition for recovery is met (all bytes have 255 unique samples).

```python
def get_flag(ciphers: np.ndarray, sample_count: int) -> bytes:
    # Each byte can only take 255, so we know the one missing is the plaintext byte.
    if sample_count <= 0:
        return b""
    collected = ciphers[:sample_count]
    counts = np.apply_along_axis(lambda col: np.bincount(col, minlength=256), 0, collected)
    missing_values = np.argmax(counts == 0, axis=0)
    return bytes(missing_values.tolist())
```

Another helper function `get_flag(ciphers: np.ndarray, sample_count: int) -> bytes` is defined to recover the plaintext once the stopping condition is met. It identifies the missing value for each byte position, which corresponds to the plaintext byte.

Finally, the main logic is defined in `solve_remote()` function, which first initializes the connection using `pwntools`, then continuously retrieves ciphertexts until the stopping condition is met, and then recovers and prints the flag.

```python
def solve_remote():
    r = pwn.remote(REMOTE_HOST, REMOTE_PORT)
    ciphers = None
    i = 0

    while True:
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

        if ciphers is None:
            ciphers = np.zeros((MAX_SAMPLES, len(cipher_bytes)), dtype=np.uint8)

        if i >= MAX_SAMPLES:
            raise SystemExit("Exceeded maximum sample limit without meeting stopping condition.")

        ciphers[i] = np.frombuffer(cipher_bytes, dtype=np.uint8)
        i += 1

        if stop(ciphers, i):
            break
    
    print(f"Required condition met after {i} samples.")
    flag = get_flag(ciphers, i)

    try:
        print(f"Recovered flag: {flag.decode()}")
    except UnicodeDecodeError:
        print(f"Recovered flag (hex): {flag.hex()}")
```

# Results

After running the solver, we were able to recover the flag with ((2871)) samples, which is slightly above the median case but still within the feasible range given the constraints of the challenge.

The final output with the recovered flag was:

```log
...
Collecting samples... [i = 2868]
Collecting samples... [i = 2869]
Collecting samples... [i = 2870]
Required condition met after 2871 samples.
Recovered flag: Alpaca{All_flowers_fade_yet_some_never_made_the_worlds_unfairly_made}
```

# Conclusion

This challenge is a brilliant example of how a simple and seemingly minor change (the key being in the range ((1 \ldots n)) instead of ((0 \ldots n))) can completely break the security of an otherwise perfect secrecy encryption scheme. By leveraging the properties of XOR and the concept of unique state sampling, it is possible to recover the plaintext with a feasible number of samples, demonstrating the catastrophic consequences of such a design flaw in cryptographic systems.

# Greetings

Thanks to the Daily AlpacaHack team for hosting these daily challenges and to kanon for creating this interesting challenge. It was a fun exercise to solve it, as it shows how small details in the design of cryptographic schemes can have a huge impact on their security, and how understanding the underlying principles can lead to effective attacks.
