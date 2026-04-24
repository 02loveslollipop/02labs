---
title: "Blue Hens CTF 2026: A Logical Deduction Writeup"
description: "Propositional logic reversing???"
pubDate: 2026-04-22
tags: ["bluehens", "reversing", "propositional-logic", "boolean-satisfiability"]
featuredImage: "figures/logical-deduction-layout.svg"
---

In this Blue Hens CTF 2026 challenge, we are given an image, that seems heavily modified/obfuscated for artificial vision, the image contains a propositional logic formula represented as a circuit diagram. And we need to solve it for `TRUE` to get the flag being the flag the values for the 11 input variables in the form `UDCTF{xxxxxxxxxxx}`.

![Original Circuit](Napkin.png)
> Circuit diagram of the propositional logic formula given for the challenge.

## Key insight

There are many ways to solve this problem, you can model the whole proposition as a boolean satisfiability problem and use a SAT solver to find the solution (for this size it shouldn't be too hard), but there is a really "efficient" shortcut we can use to solve this problem, if you take a look, most of the gates in the circuit are `XOR` and `OR` and many of them are of the form:

$$ A \oplus \bar{A} = 1 $$
$$ A \lor \bar{A} = 1 $$
$$ A \land \bar{A} = 0 $$
$$ A \oplus A = 0 $$

The key insight is that most of the gates in the circuit end up being a tautology (always true) or a contradiction (always false) regardless of the value, that makes the circuit much easier to reduce and solve. Also the second biggest insight is that all the segments before the final `AND` gate are independent of each other (Only use 1 variable for input without any reuse of variables) so we can solve each segment for `TRUE` independently and then combine the results to get the final solution.

## Solving the circuit

At this point the main is to check which segments need to be solved independently, after checking the circuit the segments are the following:

![Segments](image.png)

As we can see this become reduces into solving 12 independent segments (of which 3 are directly the input to the final `AND`), so we need to solve the other 9 segments for `TRUE` as the truth table for an `AND` gate is only `TRUE` if all the inputs are `TRUE`.

## Solution
We could get the solution by hand by checking each segment and applying the rules of boolean algebra to reduce it, but that would be very time consuming, so let's take a look at a single one just to understand how to solve it, let's take the 5th segment for example (the first purple one from top to bottom):

In here we have the following circuit:

$$ (X_2 \oplus \bar{X_2}) \oplus [X_{10} \oplus (X_{11} \land \bar{X_{11}})]  = 1 \tag {1} $$

If we decompose we can see that:

$$ X_2 \oplus \bar{X_2} = 1 \tag {2} $$

and:

$$ X_{11} \land \bar{X_{11}} = 0 \tag {3} $$

So if we replace $(3)$ and $(2)$ in $(1)$ we get:
$$ 1 \oplus [X_{10} \oplus 0] = 1 \tag {4} $$

At this point we can use the fact that $A \oplus 1 = \bar{A}$ to get:

$$ \bar{X_{10}} = 1 \tag {5} $$

And now we use the property that $\bar{A} = 1$ is equivalent to $A = 0$ to get:
$$ X_{10} = 0 \tag {6} $$

We can simply repeat this process for all the segments to get the following solution:

| Variable | Value |
| --- | --- |
| $X_1$ | 1 |
| $X_2$ | 0 |
| $X_3$ | 1 |
| $X_4$ | 0 |
| $X_5$ | 0 |
| $X_6$ | 1 |
| $X_7$ | 0 |
| $X_8$ | 1 |
| $X_9$ | 1 |
| $X_{10}$ | 0 |
| $X_{11}$ | 1 |

So the flag is `UDCTF{10100101101}`.

## Conclusion

This challenge shows that not every reverse engineering problem needs to taking a binary and trying to reverse it, the field of reverse engineering is much broader and can include almost any problem, in this case we had to reverse engineer a propositional logic formula (or perfectly a logic `circuit`) and just as with binary reverse engineering, the effects of reverse engineering can be seen on this kind of tasks, reverse engineering a logic circuit/boolean formula can allow to bypass it, allowing to a malicious user to bypass security measures, or in the case of CTFs, to solve a challenge and get the flag. This is a great example of how reverse engineering can be applied to different fields and how it can be used to solve problems that at first glance may seem unrelated to reverse engineering.

## Extra: My full solve by hand (Do not take it as correct *especially the formulas)

![Hand made solve](image-1.png)

## Greetings

Thanks to the Blue Hens CTF organizers for this amazing challenge and CTF in general, it had a lot of really interesting challenges and I had a lot of fun solving many of the hard-to-solve challenges, also the decision of making the image hard to read for AI was really interesting, as it really made the challenge harder for an LLM without making it impossible or a hassle for a human, I really liked that decision and I hope to see more challenges like this in the future.
