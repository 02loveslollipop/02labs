---
title: "TAMUctf 2026 - Forensic writeup: Phantom2"
description: "Could private forks on Github be not as private as we think?"
pubDate: 2026-03-27
tags: ["ctf", "git", "github", "forensics", "writeup"]
---

## Overview

In `Phantom2` (the second part of a 2-part challenge during TAMUctf 2026), we are given once again a link to an almost "empty" GitHub repository with a single commit and a single `README.md` file.

Just as in the previous challenge, any attempt to search for the flag in the commit history, branches, tags, and metadata in `/.git` was unsuccessful. And just as in the previous challenge, the focus shifted from analyzing the git repository to analyzing its GitHub footprint.

## Footprint

This time, the key clue came from a leak in the repository network metadata. There was a private fork of the repository made by the author of the challenge (`cobradev4/phantom2`). The conclusion that it was private came from a mismatch between the fork count shown in the GitHub UI and the forks that could be seen on the Github Events API.

## Recovery

At this point, the issue was not where the flag was, but how we could recover it from the private fork. The key insight was that the private fork was made by the author of the challenge, so we could assume that the flag was in that fork's commit history.

The working hypothesis was:

* The author pushed a commit with the flag into their private fork.
* GitHub still stored that object in the shared cross-fork repository storage, even if the commit was not visible in the public repository.

If this was the case, there was a recovery path: if we knew the SHA prefix of the commit containing the flag, we could use the GitHub API to search for that commit patch and recover the flag.

## Feasibility

The feasibility of this attack relies on the fact that GitHub stores all objects in shared storage across forks, even private ones. This means that if we can find the SHA prefix of the commit containing the flag, we can recover it using the GitHub API.

Then the question of whether this attack is feasible comes down to how easy it is to find the SHA prefix of the commit containing the flag.

We can search prefixes of 4 hex characters, which means our search space is $16^4 = 65536$ possible prefixes. This is a feasible search space to brute-force using the GitHub API, as we can make a large number of requests in a reasonable amount of time.

## Solution

The solution we executed was to brute-force search for the commit containing the flag. We used the `search/commits` endpoint to search for commits in the repository and filtered results by SHA prefix.

After iterating through the possible prefixes, we found the following commits:

* `432c`
* `454b`
* `d3ca`
* `dd21`

We knew `454b` resolved to the initial commit in the public repository, so we focused on the other three commits. After analyzing the patches, we found that the commit with prefix `d3ca` contained the flag in its patch, and we were able to recover it by accessing: [https://github.com/tamuctf/phantom2/commit/d3ca.patch](https://github.com/tamuctf/phantom2/commit/d3ca.patch)

The content of the patch was:

```patch
From d3cab66d23265b36ecd8cd410554bdfc603e3416 Mon Sep 17 00:00:00 2001
From: Noah Mustoe <62711423+cobradev4@users.noreply.github.com>
Date: Sat, 21 Mar 2026 11:04:47 -0500
Subject: [PATCH] Add flag (if you comment on this commit, you will be banned)

---
 README.md | 6 +++++-
 1 file changed, 5 insertions(+), 1 deletion(-)

diff --git a/README.md b/README.md
index 4345918..699ec43 100644
--- a/README.md
+++ b/README.md
@@ -1 +1,5 @@
-# phantom2
\ No newline at end of file
+# phantom2
+
+```
+gigem{57up1d_917hu8_3v3n7_4p1_a8f943}
+```
```
And with that, we were able to recover the flag: `gigem{57up1d_917hu8_3v3n7_4p1_a8f943}`.

> Note: the leetspeak in the flag: stupid_github_event_api. This likely indicates that the author's intended solution was likely to pull the exact SHA hash directly from a leaked PushEvent. However, exploiting the CFOR vulnerability via the brute-force script proved to be a highly effective, unintended path to victory.

## Conclusion

Both `Phantom1` and `Phantom2` present us with an important lesson about how Github handles forks and specifically private forks, even if a fork is private, the objects in it are still stored in the shared storage of GitHub, which means that if we can find the SHA prefix of a commit containing sensitive information, we can recover it using the GitHub API. This concept, technically defined as Cross Fork Object Reference (CFOR) was identified by [Truffle Security](https://trufflesecurity.com/) in  July 2024, if you want to learn more about it, check their blog post: [Anyone can Access Deleted and Private Repository Data on GitHub](https://trufflesecurity.com/blog/anyone-can-access-deleted-and-private-repo-data-github).