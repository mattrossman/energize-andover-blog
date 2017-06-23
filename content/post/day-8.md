---
author: "Matt Rossman"
date: 2017-06-15
title: Day 8
description: Debugging the calendar parser
weight: 10
---

I printed the [2016-17 Andover District Calendar](http://www.aps1.net/DocumentCenter/View/6795) and got to work entering the data. Ultimately I organized it into two calendars, one for days with no school entirely (which I inputted as 'all-day' events) and one for half days (to ensure sufficient overlap I entered the events starting from 10:50AM when school gets out and ran until 11:59PM at night).

I exported these `.ics` files, then imported them into python with my `.ical` range processor:

	no_school = egz.ical_ranges('resources/no_school_2016-17.ics')
	half_day = egz.ical_ranges('resources/half_days_2016-17.ics')

The filtering process seemed really smooth:

	df_school = egz.time_filter(df_energy,
		                    include = ('9/2/16','6/16/17'),
		                    blacklist = no_school + half_day,
		                    daysofweek=[0,1,2,3,4],
		                    times=('07:40','14:20'))

Except that when I looked at the data I was getting, it wasn't completely right.
First, all of the vacation days were still included because I accidentally exclude `exclude` instead of `blacklist`, but I got that sorted out eventually.

Then, I noticed that my half days were not filtering out. Instead of filtering *out* the half days, I tried solely included the half day ranges to see what was going wrong. The events that should have been starting at 10:50AM were starting at
2:50PM when school would have already been out, hence why they seemed to be missing.

## Time zones
Ultimately, I determined the problem to be a timezone conflict. The ranges that my ical function was outputting were in UTC time, which is 4 hours ahead. Based on how smooth things had been going so far, I assumed it would be easy to convert this object to a different timezone, right?

Not quite. This was an incredibly convoluted and time intensive debugging process. I followed a few tutorials online but none were doing what I wanted. I ended up getting it to work, but the result isn't pretty. I had to overhaul the `ical_ranges` function and make a helper function that handles the timezone conversion. I also had to add a check to see whether the item was a `datetime.datetime` object (in which case I would perform the conversion) or just a `datetime.date` object (in which case there's no time to perform any conversions on. Otherwise the program would throw an error.


	"""
	convert_range_tz : DataRange(datetime.datetime), timezone --> DataRange
	converts the ical default UTC timezone to the desired timezone
	"""
	def convert_range_tz(range_utc, local_tz):
	    convert = lambda time: pytz.utc.localize(
		    time.replace(tzinfo=None)).astimezone(
		            local_tz).replace(tzinfo=None)
	    return tuple(map(convert,range_utc))


	"""
	ical_ranges: File Path --> ListOf DataRanges
	reads the ics file at the given path, and turns the event start and end times
	into data ranges that can be read by the time_filter function
	"""
	def ical_ranges(file):
	    cal = Calendar.from_ical(open(file,'rb').read())
	    ranges = []
	    cal_tz = pytz.timezone(cal['X-WR-TIMEZONE'])
	    for event in cal.subcomponents:
			event_range=(event['dtstart'].dt,event['dtend'].dt)
			if isinstance(event_range[0],datetime.datetime):
			    event_range = convert_range_tz(event_range, cal_tz)
			ranges.append(event_range)
	    return ranges

The conversion process is pretty ugly. It seems like there shouldn't be repetition of that `tzinfo=None` statement, but that was the only was I could get it to work. The first time it occurs is because the `localize` function requires that `tzinfo` is not already set, and the second time is because the resultsing datetime objects gets another timezone attribute tacked on that messes up the pandas indexing. You'd think that I could just set `tzinfo` to the `local_tz` and it would just work properly, but I can assure you that I tried all the simpler possibilities first and none of them worked.

Anyways, I went back to that filter from the beginning of the post, and now it filters the half days properly. There are 4 remaining low-outlier days, and I cross checked these with online sources to verify that they were snow days. I added these days as a seperate list to the blacklist.

The filter currently runs as:

	df_school = egz.time_filter(df_energy,
		                    include = ('9/2/16','6/16/17'),
		                    blacklist = no_school + half_day
		                    + ['2/9/17','2/13/17','3/14/17','3/15/17'],
		                    daysofweek=[0,1,2,3,4],
		                    times=('07:40','14:20'))


{{< linked-img "school_main_16-17.png" >}}

Now I have a nice unimodal distribution of the main power usage *just* during school hours. You can visually see that blob sticking off to the right which probably is a sign of power waste.

Tomorrow I will start working on the functional implemetation of anomaly detection.

