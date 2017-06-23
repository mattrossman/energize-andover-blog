---
author: "Matt Rossman"
date: 2017-06-12
title: Day 5
description: Daytime usage first look
weight: 10
---

## Daytime usage

I haven't really addressed the daytime power usage yet. To be consistent with the EnergizeApps parser, I'll define 'day' as 5AM - 8PM (inclusive, exclusive). Likewise going forward I should define 'night' as 11PM - 4AM.

I will not only want to look at the overall daytime usage, but isolate the weekday and weekend usage since I'd expect the building to be unoccupied on weekends. Once again I get to leverage the handy `DatetimeIndex` structure which holds a `weekday` component. This component is an integer which reads as follows:

 Mon | Tue | Wed | Thu | Fri | Sat | Sun
-----|-----|-----|-----|-----|-----|-----
  0  |  1  |  2  |  3  |  4  |  5  |  6

So the weekdays correspond to days 0-4 while weekends are days 5-6.

	day_bools = (df_energy.index.hour >= 5) & (df_energy.index.hour < 20)
	df_day = df_energy[day_bools]

	df_weekday = df_day[df_day.index.weekday <= 4]
	df_weekend = df_day[df_day.index.weekday  > 4]

You can not simply join the conditionals with the `and` keyword that Python would normally understand. If you did, it would try to evaluate the entire array to either just a `true` or `false` value. Instead you use the `&` operator to perform an item-wise comparison of all individual element pairs within the boolean arrays.

 > **EDIT:** In hindsight, it would be simpler to use the `pandas.DataFrame.between_time` function here

Now to look at the plots. For overall daytime power distribution we get:

{{< linked-img "main_day.png" >}}

Another bimodal distribution. At first I assumed this was just because of the distinction between weekday and weekend usage. But the weekend is only 2 days, you would assume that the low-power peak would be much smaller than the high-power peak.

When we look at just the weekend usage we get:

{{< linked-img "main_weekend.png" >}}

It's a weird shape, but at least it's unimodal. Looking at the weekday usage, things get weirder.

{{< linked-img "main_weekday.png" >}}

The shape is still bimodal. That means there's some factor here that's still causing a split in the data. Then I remembered, this includes the whole year's worth of data. That includes the 180 days of school time, but also holidays, breaks, and summer vacation. So the heap of low power usage must be primarily from vacation.

To test this, I can look at two charts: one with a month from the summer, and one with a month during the school year. July is a good summer midpoint, and after looking at the Andover academic calendar it looks like the month of March doesn't have many days off from school. I can extract these with the `pandas.DatetimeIndex.month` property. In this case the index starts at 1 for Jan and extends to 12 for Jan.

The weekday-daytime power distribution for July:

{{< linked-img "main_july.png" >}}

And for March:

{{< linked-img "main_march.png" >}}

At first I was baffled, but then once again I realized an oversight. I am defining day as the hours from 5AM-8PM. This isn't a good index to use for a school because school doesn't run the entire day. To put this issue to rest, I'm going to isolate March's data between 7:40 and 2:20. I found a `pandas.Series.between_time()` method in the documentation, I'll use that here and probably change my use of the `.hour` attribute from earlier. If this doesn't give me a unimodal shape I don't know what will.

{{< linked-img "main_march_school.png" >}}

I'm satisfied with this result. In the console I printed the dataset that was registering under 250 kW which consisted of 4 days, 2 of which had no school in 2016 and the other 2 I'm guessing didn't have school in 2015. The rest of the distribution looks nice and symmetric.

## Filters
All of this work has just made it very clear how necessary it is to implement a robust filtering system to let administrators choose which days to include and exclude to isolate days that follow similar power usage models.

The program won't know what kind of data is being fed to it, and without that info it can't do any useful analysis. It's up to the person running the program to be able to seperate groups of similar data to individually perform analysis upon.

To make this easier, I may implement some feature that detects multiple peaks and looks for patterns within them to suggest how to make further isolations.

Up until this point, most of the programming work has been temporary scripting, but I need to start putting code into usable functions. Filters would be very helpful, so that will be my next task.

## Templating the code
In my semester at Northeastern I learned about the "design recipe" which takes a very systematic approach to programming. It's a good habit to have, and I'll loosely follow it here.


	"""
	time_filter: filters data by properties like date and time

	ARGS:
	data : DataFrame or Series with DateTimeIndex
	*timerange: Tuple with start and end time strings as HH:MM
		or list of such tuples
	*daterange: Tuple with start and end dates as YYYY-MM-DD
		or list of such tuples.
		Blank Tuple element will default to MIN or MAX
	*exclusions: List of dates to be excluded as YYYY-MM-DD
	*inclusions: List of dates to be explicity included as YYYY-MM-DD
		This will override the daterange property
	*weekdays: List of integers for days to be included
		0 = Mon, 6 = Sun

	*starred parameters are optional
	"""

So I don't forget it later, I recently found out that I can easily implement the `daterange` and `excludions` properties with the `.loc` function. E.g. I can simply type `data['2016-03-01':'2016-03-20']` to filter between those dates.

This method signature seems to cover all the filtering features that I've needed so far. Tomorrow I'll start making the code for it.

