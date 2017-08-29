---
author: "Matt Rossman"
date: 2017-08-29
title: Day 60
description: Getting the team caught up, figuring out how to run the BACnet logging script
weight: 10
---

## AHS Meeting
I met with Frank and Ajay at AHS this morning. They had been having trouble installing Pycharm so I showed them how to install it. Then I walked through the process of cloning the web server repo, creating an Anaconda environment, installing all the requirements with Anaconada/Pip, installing PostgreSQL, making the database, and configuring the server. At this point they are all caught up to the degree of functionality that I've gotten the server to.

## Testing the logging
As I feared, I immediately encountered errors when trying to run any of the data logging scripts. The primary issue was an `ImportError` where the `mysite` module is not being found. I think this has something to do with the working directory not appearing in `sys.path`. I was playing around in an interactive console located in one of the subdirectories and found I was unable to `import mysite` until I appended the working directory to `sys.path`. I suspect that somewhere in the code this step is missing...

#### Possible connection
After playing around with the python shell for a while I noticed a similar issue when I ran tried running certain scripts from different locations. The `mysite/wsig.py` script is the one I was experiencing an issue from. When I ran `python mysite/wsig.py` from the main directory I had no issues, although I found it odd that the `project` and `workspace` variables were storing empty strings. Still, I was able to import `energize_andover.models` just fine.

However when `python wsig.py` from within the mysite directory I got the same error as I got from the data logging script (about the `mysite` module not being found). When I added

	sys.path.append('/home/matt/PycharmProjects/EnergizeAndover')

which is my project directory, the error stopped. I tried adding that line to `NAEInteract1.py` and I was able to run that too.

I knew it wouldn't work off the network but I ran `findNAE()` and got

	RuntimeError: INI file with BACpypes section required

There is a `BACpypes.ini` file in the same directory. I navigated to the actual `bacnet/script/` directory before running the Python code this time and got a different error:

	OSError: [Errno 99] Cannot assign requested address

The address that it's requesting is `b'\x0A\x0C\x00\xFA\xba\xc0'`. The `b` means it's a bytes literal. The `\x` escape character is used to preced a two-digit hex value (i.e. an octet). Thus this byte notation corresponds to the IPv4 address `10.12.0.250`.

Maybe that's just the error you get when you're off the network. I'll get a better idea tomorrow when I'm back on AndoverNet.
