---
title: "TAMUctf Git Writeup: Phantom / Phantom2"
description: "Two Git challenges where the public repository is intentionally empty and the real solve path depends on hidden commits exposed through GitHub's repository network."
pubDate: 2026-03-27
tags: ["ctf", "git", "github", "forensics", "writeup"]
---

## Overview

Both `phantom` and `phantom2` start the same: a public GitHub repository that looks completely empty except for a single `README.md` and one visible commit on `main`. That naturally pushes us toward the local `.git` directory and standard Git forensics, but in both cases that path is intentionally barren.

The real trick is that the flag does not live in the checked-out public branch history. Instead, it is exposed through GitHub's broader repository object network, where commit objects can remain retrievable even when they are not part of the visible DAG of the default branch.

## Inputs

* local clone of `tamuctf/phantom`
* local clone of `tamuctf/phantom2`
* GitHub commit and patch endpoints for both repositories

## Shared starting point

For both challenges, the public repository state was minimal:

* one visible commit on `main`
* one tracked file, `README.md`
* file contents equal to `# phantom` or `# phantom2`

That makes the local repository the obvious first place to investigate. The first pass was the normal set of Git-forensics checks:

```bash
git log --all --decorate --graph
git fsck --lost-found
git rev-list --objects --all
git cat-file -p <object>
```

For `phantom2`, I also checked unreachable objects more aggressively:

```bash
git fsck --full --unreachable --no-reflogs
```

These checks showed only the expected minimal public history. There were no useful extra branches, no leaked blobs in the local object store, and no recoverable hidden content from the checked-out repository alone.

## Phantom

### Local Git forensics went nowhere

The public clone of `tamuctf/phantom` really was empty in the ways that matter locally. The object database, pack files, and visible history all matched the single-file public branch. So while checking `.git` was the correct first move, it was not sufficient to recover the flag.

### Why a hidden GitHub commit was believable

The strongest clue was the author identity on the hidden commit that eventually mattered:

* `Noah Mustoe <62711423+cobradev4@users.noreply.github.com>`

That does not automatically prove project ownership, but it does give us a concrete author identity tied to the repository network, and that same account becomes important again in `phantom2`. Once the local DAG turned out to be clean, GitHub-visible but branch-invisible history became the most credible place to look.

### Real solve path

The decisive artifact was a hidden commit still served by GitHub under the base repository path:

* `https://github.com/tamuctf/phantom/commit/b365313472870cbf887a42a7be75df741b60c8d3`

Its patch showed the flag added directly to `README.md`:

```diff
+gigem{917hu8_f02k5_423_v32y_1n7323571n9_1d60b3}
```

So the important conclusion for `phantom` is that the flag was not recoverable from the local public DAG. It was recoverable because GitHub still resolved a hidden commit object from the repository network.

### Flag

**`gigem{917hu8_f02k5_423_v32y_1n7323571n9_1d60b3}`**

## Phantom2

### Local Git checks still showed only the public branch

`tamuctf/phantom2` used the same basic setup: one visible commit, one `README.md`, and no useful local history beyond the public `main` branch. The usual local checks again confirmed that there was no flag exposed through the checked-out repository itself.

### Important public clues

This time the strongest leak was not in the local clone but in GitHub metadata around the repository network.

The key clue was that repository events pointed to a private fork owned by the same author account:

* `cobradev4/phantom2`

There was also a mismatch between the public forks listing and the observed fork count, which was consistent with at least one non-public fork existing behind the scenes.

### Solve path

The working hypothesis was:

* the author pushed a meaningful commit into the private fork
* GitHub still stored that object in the shared cross-fork repository network
* the parent repository path would resolve the hidden commit if a valid SHA prefix was known

That led to a 4-hex prefix sweep against GitHub's patch endpoint:

```text
https://github.com/tamuctf/phantom2/commit/<prefix>.patch
```

Known public commits confirmed that the prefix oracle was real:

* `454b` resolved to the public initial commit
* `432c` resolved to the public `solve` decoy

After sweeping the prefix space, the interesting hits were:

* `432c`
* `454b`
* `d3ca`
* `dd21`

The decisive one was:

* short prefix: `d3ca`
* full commit: `d3cab66d23265b36ecd8cd410554bdfc603e3416`
* author: `Noah Mustoe <62711423+cobradev4@users.noreply.github.com>`
* subject: `Add flag (if you comment on this commit, you will be banned)`

Its patch added the flag directly to `README.md`:

```diff
+gigem{57up1d_917hu8_3v3n7_4p1_a8f943}
```

The other extra hit was just more noise:

* full commit: `dd214085f2467815e7d06b7cc97ad4cb9dec950a`
* author: `A Ganga shankar <agangashankar2006@gmail.com>`
* change: adds a stock `SECURITY.md`

So just like `phantom`, the solve did not come from the local checkout. It came from understanding that GitHub's repository network could still serve commit objects from outside the visible public branch history.

### Flag

**`gigem{57up1d_917hu8_3v3n7_4p1_a8f943}`**

## Final flags

* **Phantom:** `gigem{917hu8_f02k5_423_v32y_1n7323571n9_1d60b3}`
* **Phantom2:** `gigem{57up1d_917hu8_3v3n7_4p1_a8f943}`

## Conclusion

These two challenges are a good reminder that "Git forensics" and "GitHub forensics" are not always the same thing. The local repository was intentionally clean enough to waste time if we treated `main` as the entire truth. The real attack surface was GitHub's handling of hidden commit objects across the repository and fork network.

For `phantom`, the solve was recognizing that a hidden commit on the base repository was still directly accessible. For `phantom2`, the extra step was using a private-fork clue plus a short-prefix patch oracle to discover the right commit. In both cases, the strongest evidence came from author-attributed commit objects, not from later comments or noisy public decoys.
