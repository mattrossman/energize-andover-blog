---
author: "Matt Rossman"
date: 2017-08-23
title: Day 55
description: Meeting, server setup intro
weight: 10
---

## AHS Meeting
I met with Anil and Kevin this morning at the AHS library. The usual work area is emptied out for cleaning, and there's furniture strewn around the library. I gave an overview of the forecasting process and how it can be merged with the existing server.

## Cloning the server
Kevin started walking me through the process of copying the web server to my work laptop. First I installed PyCharm and `postgresql`. I then followed a guide he gave me to set up a database and user.

I pulled the latest version of the web server's [GitHub repo](https://github.com/EnergizeAndover/energize_andover) and moved to the [`Electrical_Mapping`](https://github.com/EnergizeAndover/energize_andover/tree/Electrical_Mapping) branch.

We struggled to install all the required packages, and would often get errors for not having packages that we knew were installed. Part of the confusion arose from the presence of three different Python versions present on my system (a default 2.7 version, a 3.5 version, and Anaconda's 3.6 version). We weren't able to get it figured out before we had to leave.

When I got home I was tried creating a clean Anaconda virtual environment and installing all the requirements from the `requirements.txt` file. Anaconda only had some of the packages available, so the rest I installed with `pip`. The ultimate goal was to run

	$ python3 managy.py makemigrations

When I tried it this time, I saw that I needed to install the `bacpypes` package, which I did with `pip`.

The next time the commmand took longer to run, and I got an error about a "nonexistent parent node". I don't know how migrations function in Django, but from what I gather there should be a file called `0001_initial.py` in my `energize_andover/migrations/` directory (like there is for `bacnet/migrations/`). When I removed the dependency entry for this missing `energize_andover/migrations/0001_initial.py` file from the `bacnet/migrations/0001_initial.py` file, the error message was replaced with `No changes detected`. It's good that I'm not having an error at least. On the other hand, it's possible that I just told the `makemigrations` command to do nothing.

I'm going to see what Kevin has to say about this progress since I have next to no knowledge about how this is all supposed to work.
