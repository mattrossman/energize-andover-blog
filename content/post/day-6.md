---
author: "Matt Rossman"
date: 2017-06-13
title: Day 6
description: Time filtering
weight: 10
---

Today I'll be implementing the `time_filter` function that I outlined yesterday. Since then, I made some slight adjustments to the signature that you can see in the final version below.

## Packing and Unpacking

First thing I had to look up was how to handle optional parameters. It seems that you can use an asterisk `*` before an argument to get a Tuple of optional positional parameters, while a double asterisk `**` is for a Dictionary of optional keyword parameters.

This is a subset of the larger topic of packing and unpacking in Python. When used in a parameter field, the `*` and `**` operations pack arguments into a Tuple or Dictionary, respectively. Outside of that context, they perform the inverse operation, unpacking a Tuple or Dictionary into its contained arguments.


## Dates and Times
This proves useful with my `time_filter` function which has a number or optional parameters, some of which are Tuples themselves which simply need to be unpacked.

For example, the line:

	data.between_time(*timerange)

will unpack the start and end times contained in the `timerange` parameter and pass them as arguments to the `between_time` function.

I also learned about the `slice()` function which turns its arguments into a slice to use for indexing. In combination with the `*` operator, I can say

	data[slice(*daterange)]

to unpack the start and end dates, turn them into a slice, and use that slice to state the index bounds.

To handle the possible *list* of entries for each of these parameters, I can check `if type(daterange[0]) is tuple` and in that case do some more lambda calculus to perform the operation on all the subranges provided, then concatenate the results. I learned that it is important to then perform the `sort_index` function on the concatenated result since it does not automatically reorder the entries by their timestamp.

For the `daysofweek` parameter, I can use Python's [list comprehension](https://docs.python.org/2/tutorial/datastructures.html#list-comprehensions) feature to generate a boolean array of whether each day's `datetime.dayofweek` attribute is contained in the list provided by the user:

	data[[day in opt_kwds['daysofweek'] for day in data.index.weekday]]


## Inclusion / Exclusion
The `exclusions` parameter is a little tricky, mainly from my minimal familiarity with `Timestamp` and `DateTimeIndex` objects. Normally you would use the `pandas.DataFrame.drop()` function to remove objects based on their index, but it requires the exact index labels. The [partial string indexing](https://pandas.pydata.org/pandas-docs/stable/timeseries.html#partial-string-indexing) that lets you easily index all entries from a certain day don't apply here. One solution is to use partial string indexing to get a series of entries from the given days, retrieve the indexes of those days, and pass that list of indexes to the `drop()` function:

The other annoying part is that partial string indexing, unlike exact string indexing, doesn't let you pass in a list of items to select. So I'll have to iterate through the exclusion dates and build up a cumulative list of indexes. Not a big deal but I wish there was a built in way to do this.

Instead of doing this with a loop, I can use the `map()` function and `lambda` keyword to apply my action over each date. The list of indexes that `.index` returns is an `ndarray` object, part of the `numpy` library. As such, I have to use the `numpy.concatenate` function [as described in the documentation](https://docs.scipy.org/doc/numpy/reference/generated/numpy.concatenate.html).

	to_drop = np.concatenate(list (map(lambda x: out[x].index,
		opt_kwds['exclusions'])))
	out = out.drop(to_drop)

Adding elements is a simpler process so I will just use a loop to add the desired entries in the `inclusions` list:

	for date in opt_kwds['inclusions']:
		out = out + data[date]

## Final Product

In my examples I operated on the data directly but really I'm keeping a running `out` DataFrame variable that tracks all of my changes.

This is the function in its current state, subject to change as I learn more efficient ways to use Pandas and NumPy.

	"""
	time_filter: filters data by properties like date and time

	ARGS:
	data : DataFrame or Series with DateTimeIndex
	*timerange: Tuple with start and end time strings as 'HH:MM'
		or list of such tuples
	*daterange: Tuple with start and end dates as 'YYYY-MM-DD'
		or list of such tuples.
		Enter None to set to min or max date
	*exclusions: List of dates to be excluded as 'YYYY-MM-DD'
	*inclusions: List of dates to be explicity included as 'YYYY-MM-DD'
		This will override the daterange property
	*daysofweek: List of integers for days to be included
		0 = Mon, 6 = Sun

	starred parameters are optional
	ranges are all inclusive
	"""

	def time_filter(data, **opt_kwds):
	    
		out = data

		if ('exclusions' in opt_kwds):
			to_drop = np.concatenate(list (map(lambda x: out[x].index,
								opt_kwds['exclusions'])))
			out = out.drop(to_drop)
		if ('timerange' in opt_kwds):
			timerange = opt_kwds['timerange']
			if type(timerange[0]) is tuple:
				out = pd.concat(list(map(
					lambda subrange: out.between_time(*subrange),
			timerange))).sort_index()
			else:
				out = out.between_time(*timerange)
		if ('daterange' in opt_kwds):
			daterange = opt_kwds['daterange']
			if type(daterange[0]) is tuple:
				out = pd.concat(list(map(
				lambda subrange: out[slice(*subrange)],
				daterange))).sort_index()
			else:
				out = out[slice(*daterange)]
		if ('daysofweek' in opt_kwds):
			out = out[[day in opt_kwds['daysofweek'] for day in out.index.weekday]]
		if ('inclusions' in opt_kwds):
			for date in opt_kwds['inclusions']:
				out = out + data[date]
		return out

As an example, if I want entries from March and April 2016 between 7:40AM and 2:20PM on Mon Wed Fri, I can do so with

	time_filter(df_energy,daterange=('2016-03','2016-04'),timerange=('7:40','14:20'),daysofweek=(0,2,4))

As I write this I remember I will want to add another parameter for month selection, since the `daterange` argument only lets you select months from a specified year.
