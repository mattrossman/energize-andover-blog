---
author: "Matt Rossman"
date: 2017-08-24
title: Day 56
description: Slow progress with the setup
weight: 10
---

I spent part of today watching some basic Django tutorials since I have no knowledge of how it works. That made it a little easier to understand the directory structure of the existing project. After a while I wanted to try tackling yesterday's error.

Some online sources suggest you can just wipe out the existing migrations and start fresh (I'm just trying to get *anything* working at the moment). I gave that a shot, deleting the `migrations` directory from each of the app directories.

Next I got an authentication error. This was coming from `development_settings.py`, where I had to change the database name, username, and password to the placeholder ones I set up yesterday with Kevin. It's a good thing I didn't forget them yet, I didn't know where I would need them.

When running the server with `python manage.py runserver`, I was brought to a login page. I didn't know what the credentials were, so I tried the ones that I had just set (the placeholders from postgresql). No dice. I tried admin/password and some other common defaults, nothing was working. I eventually found that I had to use the `createsuperuser` command from `manage.py` to create an administrator account.

I used these new credentials to login and... was brought to an error page.

	django.db.utils.ProgrammingError: relation "energize_andover_school" does not exist
	LINE 1: ...hool"."id", "energize_andover_school"."Name" FROM "energize_...

At this point it's getting beyond me as someone with no Django experience. I tried a quick Google search of my issue and found no clear solution. It's entirely possible that this is just stemming from my previous naive attempts at fixing my errors.

I'm going to see if Jordan is able to give some pointers. Ideally there would just be a list of steps you could run to get from the GitHub repo to a working server without having to jump through all these hoops.
