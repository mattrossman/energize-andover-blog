---
author: "Matt Rossman"
date: 2017-06-21
title: Day 12
description: Night data plotting, temperature data update
weight: 10
---

While I wait on the temeprature data report, I'll transition back to the night data. Before I was just looking at distributions, now I want to see the plots and look for any patterns.

As a reminder, I'm saying 'night' data lies between 11:00PM and 4:00AM

## Downsampling the Night Data
The plots thusfar have been pretty cluttered because I'm looking at every timestamp entry from every day of the sample region. At the moment I'm mostly looking for outlier days, so I can clean up the plots by first downsampling my data to broader time entries.

I can say

`night_main.resample('D').mean()`

to break my night series into chunks by the day on their timestamp, and then find the average of each chunk. This replaces a day's worth of variation with a single data point representing the mean value of that day. I pick the mean here rather than the median because if there is an outlier in that day, I want to be able to detect it. The mean will be more affected by outliers than the median.

Here's the plot with every single entry:

{{< linked-img "cluttered.png" >}}

And here's the mean downsampled plot:

{{< linked-img "uncluttered.png" >}}

You can see how much cleaner it is when just looking at one point per day.

There is a lot of weird variation going on here. The average power values range from 72 to 230 kW. If this was the daytime, the variation would make sense. But between 11 and 4 the school should be empty.

Weirder still is the fact that there's a surge of night power usage midway through July 2016 when school isn't even in session. I'm going to focus in on that Jul-Oct period and narrow down what's causing the increase.

{{< linked-img "jun-oct_no-main.png" >}}

It looks like the gym is the biggest culprit here, along with the Collins Center. Anil mentioned I should ignore the Collins Center as it is rented out for various events throughout the year.

## Temperature update
I just got an email with my finished temperature data order. Time to see what kind of data I'm dealing with.

It's a CSV file with timestamps, station name, min, max, and observed temperatures. I can ignore the station name column, it has the same value for every entry. There are some values entered as `-9999` which are presumably errors. In the `read_csv` function I can set `na_values=-9999` to avoid having ridiculous outliers.

	df_temp = pd.read_csv('resources/temperature.csv',
		              index_col=1,
		              na_values=-9999).drop('STATION',axis=1)

	df_temp.index = pd.to_datetime(df_temp.index,format='%Y%m%d')

This gives me a nice dataframe of time indexed temperature data. Here's a plot of all the data I got:

{{< linked-img "temp.png" >}}

It follows a pretty smooth seasonal wave. To look for a relationship between mean power usage (using my downsampled nighttime data) and temperature, I plotted one against the other: 

{{< linked-img "main_v_temp_night.png" >}}

It's an interesting tilted U-shape. Nighttime power usage sinks on days that are 50°F, but rises on hotter or colder days. In the hot seasons, the gym and lighting usage contribute to the rise, while on the colder days it's the kitchen and emergency power mains that see a noticable increase:

{{< linked-img "ke_v_temp_night.png" >}}

Switching over to a time plot of the kitchen and emergency power usage:

{{< linked-img "ke_night.png" >}}

This is not what I would have expected. I would imagine emergency power only gets used in case the power gets knocked out, and the kitchen should be using a constant amount of power at night year-round.

In 2016 alone, there were exactly 100 days when the average nighttime kitchen/emergency power usage was above 40 kW. It would help if I had a better understanding of the sources of this column's data. Maybe it actually is used for charging an emergency power bank, so in the colder months it is used in preperation of power issues? Or maybe the lunch staff has been cooking up some midnight snacks...


## Detecting data disjointedness
Rather than me manually finding things like the odd split in the kitchen/emergency data, I want to make code that will find patterns like this for me. This code could then be run on any dataset that is supposed to be constant (e.g. nighttime data) but probably not on data with expected variation.

Some patterns it could look for:

- Day of the week
- Week of the month
- Month of the year
- Time of day
- Outside temperature
<br><br>
I will begin work on this next time.
