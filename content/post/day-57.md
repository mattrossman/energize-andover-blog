---
author: "Matt Rossman"
date: 2017-08-25
title: Day 57
description: Getting the server working, starting to understand the mechanics
weight: 10
---

## Finally working
With the suggestions from Jordan I was able to get the server running locally on my system.

Some things I did differently (starting from the latest version on GitHub):

- I set the admin password for the default `postgres` account and used those credentials in the development settings file rather than the credentials for the `myusername` user account that Kevin had me make on Wed.
- I dropped the existing database and made a new one.
- I still had to delete the existing migrations folders, but this time I individually ran `makemigrations` for `energize_andover` and then `bacnet` followed by a generic `migrate` command.
- I ran `python manage.py setup` to create the admin account rather than using `createsuperuser`.

<br>
After this I was able to `python manage.py runserver` and log in successfully. I've never used this interface myself but from the demos I've seen I generally knew how to add a school from the provided CSV files. I still get an error from some processes like the QR generator.

## Poking around
I started looking around the source files to see how things work. The realtime grapher is the main source of interest for me.

The process consists of two parts. One is using BACnet to make a log of values in a CSV file, the other is to use that CSV file to plot the recorded values on the webpage.

That sounds promising (if the page can plot the recorded values it can plot the predictions), but one difficulty is a discrepancy of formatting. The CSV log currently is a big stream of recordings with the panel, units, and school name as labels attached to each measurement.

The files that I've been working with have the panel and units as headers and each entry is just logged along with a timestamp. I can see how the former approach is easier to implement, but it makes things a little messy and I can't plug that kind of file into the forecast model.

It does seem that this involves storing a lot of redundant information. Every entry stores "Andover High School" as the associated school name, it would seem cleaner to just store this value once and associate the name with the filename.

#### Solutions

I see a couple of approaches:

- Directly change the format of the recorded data sheet.
- Parse the existing data sheet into a different format.

<br>
I will have to discuss this with Kevin and see what he thinks. Another thing, we're only logging values for AHS at the moment so it doesn't seem necessary yet to include the school name with data points (the AHS name is currently hardcoded into the logging script).

I think the idea is that the `trend.csv` file will hold all the trend data for every school. Another approach would be to make seperate trend files for each school to keep things organized.

Here's an idea of the structure I had in mind:
<pre><code class="nohighlight">trends
 |___ 1
 |    |___ trend.csv
 |    |___ pred_vals.csv
 |    |___ pred_stds.csv
 |
 |___ 2
 |    |___ trend.csv
 |    |___ pred_vals.csv
 |    |___ pred_stds.csv
 |
 |___ 3
      |___ trend.csv
      |___ pred_vals.csv
      |___ pred_stds.csv
</code></pre>

Each number corresponds to a school ID. I know that this system is already in place since it is used to create the grapher URL (e.g. Graph1 is for AHS). And the `trend.csv` file would look more like:

Timestamp | Main (kW) | DHB (kW) | DG (kW) | DE (kW)
----------|-----------|----------|---------|-----------
2017-08-04 16:45:00 | 112.019 | 62.227 | 49.937 | 32.541
2017-08-04 17:00:00 | 110.128 | 61.847 | 56.039 | 31.119

and so on (those are mostly just random numbers).

Then I could plug `trend.csv` into a `MultiRFModel` to create `pred_vals.csv` and `pred_stds.csv` for each school. This would imply that every type of information being recorded would be modeled and predicted. This may not be necessary, so perhaps I should add a parameter to the models to restrict which columns are modeled and predicted.

Another thing that worries me is the fact that currently, `trend.csv` is not at strict 15-minute marks. The points are more or less 15 minutes apart, but they are not precisely stored at 00:00, 00:15, 00:30, etc. Instead it's more like 2017-08-10 11:44:16. The model would be pretty strict about having perfect data freqeuncy so we'll want to round the timestamps to the nearest 15-minute mark.
