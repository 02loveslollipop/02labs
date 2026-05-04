---
title: "Daily AlpacaHack: Permission Denied 2 Writeup"
description: "At this point I don't know what to put here part 2"
pubDate: 2026-05-01
tags: ["alpacahack", "misc", "unix permissions"]
---

In today's Daily AlpacaHack challenge, we have the same goal as yesterday: read `flag.txt` from a Debian Trixie shell. The flag file is created by root in the `alpaca` user's home directory (`/home/alpaca`), but this time instead of using `echo Alpaca{REDACTED} > flag.txt` and `chmod 400 flag.txt`, the flag is created using `install -m 400 /dev/stdin flag.txt`. Because the file is created with mode `0400` from the start, we cannot exploit the same race as before.

# The challenge

Just as yesterday, we are given both the connection to the shell (via netcat) and the source code to instantiate the challenge: `Dockerfile`, `docker-compose.yml` (not relevant here), and `chal.sh` (which is the entrypoint of the container). Let's take a look at `chal.sh` and `Dockerfile`:

```dockerfile
FROM python:3.14.4-slim-trixie
RUN apt-get update && apt-get install -yq socat
RUN useradd -m alpaca
WORKDIR /home/alpaca
COPY --chmod=400 chal.sh ./
CMD ["socat", "tcp-listen:1337,fork,reuseaddr", "exec:'bash chal.sh',stderr,pty,ctty,setsid,echo=0"]
```

```bash
echo Alpaca{REDACTED} |
install -m 400 /dev/stdin flag.txt
runuser -u alpaca -- sh
rm flag.txt
```

The key difference with the previous challenge, and what allows us to recover the flag at all, is that `chal.sh` is saved in the home directory of the `alpaca` user (the one we own). We can't read `chal.sh` (mode `0400`, owned by root), but we can delete it: deletion requires write permission on the *parent directory*, not on the file itself, and `alpaca` has write permission on `/home/alpaca`. This means that we can overwrite `chal.sh` with a custom script that will allow us to read the flag, since it is executed as root via the Dockerfile's `CMD`.

# The exploit

As said before, the main idea of the exploit is to overwrite `chal.sh` with a custom script that will allow us to read the flag (it can simply be `cat flag.txt`), and then trigger the execution of that script by connecting to the shell from another terminal.

This is the exploit path:

1. First we open a shell connection to the challenge and remove the `chal.sh` file using `rm chal.sh`. This will allow us to create a new `chal.sh` file with our custom script.

```bash
rm chal.sh
```

2. Now we can create a new `chal.sh` file with our custom script.

```bash
echo "cat flag.txt" > chal.sh
```

3. Finally, we can trigger the execution of our custom `chal.sh` script by connecting to the shell from another terminal. This will execute our script as root and allow us to read the flag.

   Note: keep the first connection open while triggering the second — the original `chal.sh` is the one that created `flag.txt`, and exiting it will run `rm flag.txt` before our replacement gets a chance to read it.

```bash
$ nc 34.170.146.252 63303
Alpaca{h4s_c0mpl3t3_p3rm1ss10ns_0v3r_3v3ry7h1ng}
```

# Conclusion

In comparison to the other, where the issue was the way the flag file was being created and granted permissions (allowing a race condition), in this one the issue is that the `chal.sh` script is executed as root but is stored in a location where we have write permissions, allowing us to overwrite it and gain arbitrary code execution as root, which is enough to read the flag.

# Greetings

As always, thanks to the Daily AlpacaHack team for hosting these daily challenges, and once again this time to minaminao as the admin of Daily AlpacaHack and author of this challenge. Both challenges (this one and the previous one) were really fun and interesting to solve, as both show how a tiny difference in the way the flag file is created and stored can lead to completely different attack paths.