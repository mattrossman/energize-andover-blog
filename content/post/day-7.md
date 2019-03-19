---
author: "Matt Rossman"
date: 2017-06-14
title: Day 7
description: Generating complex time ranges with ical files, and improvements to time filtering
weight: 10
featured: true
---

For institutions with very complex schedules, the basic filtering I created yesterday probably won't suffice. Instead, it may be nicer to let the user set their desired schedules in a graphical environment and use that as a time filter in the application.

Rather than making my own graphical solution, I'll let the user do so in their environment of choice and simply import that data in the popular `.ical` format, which consists of `.ics` calendar files. Applications like [Google Calendar](https://calendar.google.com) let you export this type of data.

I will have to write some code to parse these `.ics` files and generate lists of time ranges. I'm thinking I'll generate these as lists of timestamp tuples, which can then simply be passed to the `daterange` parameter of my `time_filter` function. I won't care about any features of the calendar events besides their start and end timestamps. It will be up to the user to properly seperate their calendars into desired categories.

## ICS Format
I started by making a fresh calendar with a single event and exporting it. This is the contents of the `.ics` file generated:

	BEGIN:VCALENDAR
	PRODID:-//Google Inc//Google Calendar 70.9054//EN
	VERSION:2.0
	CALSCALE:GREGORIAN
	METHOD:PUBLISH
	X-WR-CALNAME:Energize Andover Test
	X-WR-TIMEZONE:America/New_York
	X-WR-CALDESC:
	BEGIN:VEVENT
	DTSTART:20160307T130000Z
	DTEND:20160311T220000Z
	DTSTAMP:20170614T160347Z
	UID:lbinms85k7rmr6et5a1m19h854@google.com
	CREATED:20170614T160336Z
	DESCRIPTION:
	LAST-MODIFIED:20170614T160336Z
	LOCATION:
	SEQUENCE:0
	STATUS:CONFIRMED
	SUMMARY:Test Event
	TRANSP:OPAQUE
	END:VEVENT
	END:VCALENDAR

Events are stored in `VEVENT` blocks, all within a main `VCALENDAR` block. Rather than trying to parse this data myself, I'm going to see if there's an existing way to do it.

Someone made an [iCalendar library](http://icalendar.readthedocs.io/en/latest/) that can probably help me. Documentation is *awful*, but all I need are `datetime` objects from my events so I should be able to scrap together a solution from forum posts.

Since the library is not included with the Anaconda installer, I first updated the pip package installer with `conda install pip` and then used pip to install the package with `pip install icalendar`. 

## Object format
Components in `icalendar` function kind of like Dictionaries. They can have key-access values like `'DTSTART'` (case not sensitive) which you could access like a normal Dictionary. They also can function as bundles of components, which you can access with `component.subcomponents`.

First I read in my test file with

	from icalendar import Calendar
	cal = Calendar.from_ical(open('test_cal.ics','rb').read())

Now I can get a list of my calendar events with `cal.subcomponents`, iterate through them, and index their `dtstart` and `dtend` values. These values must be followed by `.dt` to turn them into a standard `datetime` or `date` object, otherwise they're in a propietary format for the module.

## Up and running
Much to my surprise, the implementation was remarkably straightforward.

	def ical_daterange(file):
		cal = Calendar.from_ical(open(file,'rb').read())
		timeranges = []
		for event in cal.subcomponents:
			timeranges.append((event['dtstart'].dt,event['dtend'].dt))
		return timeranges

Just like that, I have a list of daterange tuples. The real test was whether this would play nicely with my filter function. Python confuses me with its vast interweaving of very similar object types, and I was doubting that the generic datetime objects created by the `icalendar` library would translate over to the Pandas datetime indexes.

It turns out, they do translate over. I ran a test with

	test_range = ical_daterange('test_cal.ics')
	test_filtered = time_filter(df_energy,daterange=test_range)

and got a dataframe filtered by exactly the times I specified in my calendar.

## Edge behavior
In my test calendar I included a normal event with a start and end time, as well as an 'all-day' event that only holds a date, no time. The date/time event filters inclusively by the timespan specified (an event from 3PM-5PM will include 3PM and 5PM entries).

The 'all-day' event spans from midnight to midnight. So an event on 3/20/16 will span from 00:00:00 on 3/20/17 to 00:00:00 on 3/21/17. So it's just a hair over 24 hours, not a problem.

## Modifying the time filter method
Now that I know what kind of data I might be feeding it, I think I should change how the `time_filter` function operates. Right now I have `daterange` and `inclusions` parameters which perform similar tasks. Also, you can only exclude specific days, you can't specify a range. The whole date selection process could be make more robust if the process for including and excluding dates functioned the same way, and if the date inclusion feature was just an extension of the daterange parameter. Furthermore, the label `daterange` is misleading because it can also include timestamps

I'm going to get rid of the `inclusions`, `exclusions`, and `daterange` parameters. They will be replaced by `include` and `blacklist`. The `timerange` will be renamed to `times` for simplicity.

The `include` parameter will accept either a single time range tuple, a single date, or a list of any combination of the two. I wanted to call it `range` but that is already a Python keyword.

The `blacklist` will function the same way, but it will override the `include` parameter. If it becomes necessary in the future, I may also add a whitelist that overrides both.

I'll also take this opportunity to add the `months` filter I mentioned yesterday.

## The updated code

I added a couple of helper functions to reduce the amount of duplicate code. Their signatures are provided.

	"""
	range_token_df: DataFrame, RangeToken --> DataFrame
	Returns a dataframe filtered by the range token provided.

	A RangeToken is either a datetime index (parial or formal)
	or a tuple of start/end datetime indexes
	"""
	def range_token_df(data, token):
	    if (type(token)==str):
			return data[token]
	    else: # token is a start/end tuple
			return data[slice(*token)]

	"""
	data_in_range : DataFrame/Series, Data range --> DataFrame/Series
	filters the input data by the date range provided
	"""

	def data_in_range(data, d_range):
	    if (type(d_range[0])==tuple):
			return pd.concat(list(map(
				lambda token: range_token_df(data,token),
				d_range))).sort_index()
	    else:
			return range_token_df(data,d_range)

And here's the updated `time_filter` code and signature:

	"""
	time_filter: DataFrame/Series, ... --> DataFrame/Series
	filters data by properties like date and time

	PARAMETERS:
	data : DataFrame or Series with DateTimeIndex
	*times: Tuple with start and end time strings as 'HH:MM'
			or list of such tuples
	*include: Accepts:
	    1) A datetime index (partial or formal)
	    2) A tuple of start and end datetime indexes (See 1)
				Enter None to set to range min or max
	    3) A list that contains any combination of types 1 and 2
	*blacklist: range of dates to be excluded.
	    See include parameter for acceptable format
	    Overrides include parameter
	*daysofweek: List of integers for days to be included
			0 = Mon, 6 = Sun
	*months: List of integers for months to be included
	    1 = Jan, 12 = Dec

	starred parameters are optional
	ranges are all inclusive
	"""

	def time_filter(data, **kwds):
	    out = data
	    if ('include' in kwds):
			out = data_in_range(out,kwds['include'])
	    if ('times' in kwds):
			timerange = kwds['times']
			if type(timerange[0]) is tuple:
			    out = pd.concat(list(map(
				    lambda subrange: out.between_time(*subrange),
				    timerange))).sort_index()
			else:
			    out = out.between_time(*timerange)
	    if ('daysofweek' in kwds):
			out = out[[day in kwds['daysofweek'] for day in out.index.weekday]]
	    if ('months' in kwds):
			out = out[[month in kwds['months'] for month in out.index.month]]
	    if ('blacklist' in kwds):
			out = out.drop(data_in_range(data, kwds['blacklist']).index, errors='ignore')
	    return out

I think it's looking much cleaner. Based on my testing so far, everything should work out nicely. Tomorrow I will work on entering the Andover District Calendar data into Google Calendar, then running that calendar output through my range converter and time filterer.
