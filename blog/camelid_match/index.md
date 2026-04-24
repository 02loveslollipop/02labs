---
title: "Daily AlpacaHack: Camelid Match Writeup"
description: "How a 1 changes a complete mess into a pattern that can be checked"
pubDate: 2026-04-24
tags: ["alpacahack", "crypto", "multiparty-computation"]
---

This Daily AlpacaHack challenge gives us a 5-card binary string and asks whether Alice and Bob both like a certain animal. From this point on, we will refer to ♡ as `1` and ♧ as `0`: two bits represent Alice's preference, two bits represent Bob's preference, and the middle bit in the unrotated string is shared and known. The goal is to predict, for each of the 10 animals, whether both Alice and Bob like it using only the revealed 5-bit string.

The reason this is not straightforward is that the first two bits are swapped, and then the 5-bit string is rotated by a random amount from 0 to 4. Since the patterns are `01` and `10`, we can't align the bits reliably to know which bits belong to Alice and which bits belong to Bob. For example, if Alice likes the animal and Bob does not, the string before the final rotation can be:

$$\begin{aligned}
0\ 1\ 1\ 0\ 1 \\ \tag{1}
\end{aligned}$$

But if Alice does not like the animal and Bob does, the string before the final rotation can be:

$$\begin{aligned}
1\ 0\ 1\ 1\ 0 \\ \tag{2}
\end{aligned}$$

Rotating the second string by one position gives the first string. So once we observe `01101`, we cannot tell which of those two assignments produced it.

The key insight comes from two facts: the middle bit is always `1`, and the first two bits are swapped. Before that swap, the case `Alice likes, Bob likes` looks like this:

$$\begin{aligned}
1\ 0\ 1\ 1\ 0 \\ \tag{3}
\end{aligned}$$

After swapping the first two bits, it becomes:

$$\begin{aligned}
0\ 1\ 1\ 1\ 0 \\ \tag{4}
\end{aligned}$$

At this point, the case where Alice and Bob both like the animal has all three `1` bits next to each other, if we read the string circularly. Since the last step only rotates the string, that property survives the shuffle. We do not need to recover the rotation amount, and we do not need to know which two bits came from Alice or Bob.

## Why does this work?

Because there are always exactly two `0` bits and three `1` bits in the final string. The middle card is fixed to `1`, and each preference is encoded as either `10` or `01`, so Alice contributes one `1` and one `0`, Bob contributes one `1` and one `0`, and the shared middle card contributes the extra `1`.

The clean combinatorial punchline is that, on a 5-cycle, binary strings with weight 3 have only two rotation classes: the class where the three `1` bits are contiguous, and the class where they are not. After the first two cards are swapped, the protocol maps exactly the predicate we care about onto those classes:

$$\begin{aligned}
a \land b = 1 &\Rightarrow rot(11100, k) \\
a \land b = 0 &\Rightarrow rot(11010, k)
\end{aligned}$$

The first family always contains three contiguous `1` bits when checked circularly. The second family never does: it has two adjacent `1` bits, then the third `1` is separated by a `0`.

So the whole test can be reduced to this:

1. Duplicate the string, so circular runs become ordinary substrings.
2. Check whether `111` appears.
3. If it does, Alice and Bob both like the animal. If it does not, they do not both like it.

The important detail is that, with middle bit `1`, the protocol detects exactly the case $a=b=1$. More generally, this trick only tells us whether both bits equal the fixed middle value. If the middle card had been `0`, the same structure would detect the case where both values are `0`, but it would not detect when both values are `1`: the useful contiguous block would be built around the fixed middle value.

This also means the scheme does not let us recover the exact values of $a$ and $b$ when the predicate is false. In the $rot(11010, k)$ family, the cases $(0,0)$, $(0,1)$, and $(1,0)$ are all possible after some rotation, so the random rotation destroys the alignment information we would need to say which side was Alice and which side was Bob.

## Solve

With this observation, we can connect to the service and answer `y` exactly when the revealed cards contain a circular run of three ♡ symbols:

```bash
$ nc 34.170.146.252 43344
Do both Alice and Bob like alpacas? (y/n)
Open cards: ♡♧♡♡♧
> n
Do both Alice and Bob like llamas? (y/n)
Open cards: ♧♡♡♧♡
> n
Do both Alice and Bob like guanacos? (y/n)
Open cards: ♡♡♧♡♧
> n
Do both Alice and Bob like vicunas? (y/n)
Open cards: ♧♡♧♡♡
> n
Do both Alice and Bob like saiga antelopes? (y/n)
Open cards: ♧♡♧♡♡
> n
Do both Alice and Bob like markhors? (y/n)
Open cards: ♧♡♡♡♧
> y
Do both Alice and Bob like yaks? (y/n)
Open cards: ♧♡♧♡♡
> n
Do both Alice and Bob like reindeer? (y/n)
Open cards: ♡♡♧♧♡
> y
Do both Alice and Bob like musk oxen? (y/n)
Open cards: ♧♡♡♡♧
> y
Do both Alice and Bob like ibexes? (y/n)
Open cards: ♡♧♡♡♧
> n
Alpaca{private_choices_shared_yes}
```

## Conclusion

This is a perfect example of how we can create "meaning" for certain cases using a clever construction. The protocol lets us detect one specific case, where both Alice and Bob like the animal, by mapping it to the only relevant rotation class with three contiguous `1` bits on a 5-bit cycle. The random rotation is what hides the alignment for all the other cases: if the criterion is not met, we know the predicate is false, but we can't reliably determine which false case produced the cards.
