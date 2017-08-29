---
author: "Matt Rossman"
date: 2017-08-28
title: Day 59
description:
weight: 10
---

## Data recording
My top priority is getting the prediction system in place, even if the web app can't graph the resulting data. Before I can let `MultiRFModel` do its magic I need properly formatted data.

### Current system
The current data logging system takes place in `/bacnet/script/`. The logging task is in `NAEInteract1.py` and it's scheduled to run every 15 minutes in `NAEMonitoring.py` (although I also see some scheduling framework in `tasks.py`).

I won't try to decode how most of the bacpypes library works, but I generally understand that sensor IDs such as `3007360` (for the "Main (kW)" value) are used to make a  `ReadPropertyRequest` from BACnet.

The `NAEInteract1.write()` method is where the `trend.csv` file is built. This line:

	csv.write(str(count) + "," + str(datetime.now()) + "," + name + "," + str(value) + "," + school + ",\n")

writes the table entries. The call to `datetime.now()` is part of what's causing the imperfect timestamps (since there's a small bit of processing time between the scheduled task and when the task is ready to write to the CSV file). It's possible that some of the blame also lies in the `sched.scheduler` accuracy. I don't have experience with the `sched` library I can't speak for how "perfect" its scheduling works. I met as well find that out right now.

I scheduled a basic task that adds the current time to a list every second for ten iterations.

	x = list()

	def task():
	    x.append(datetime.now())

	def pull_data():
	    s = sched.scheduler(time.time, time.sleep)
	    for i in range(10):
			s.enter(1, 1, task, ())
			s.run()


Afterwards I turned that list into a Series and found the average time difference between its values:

	>>> pd.Series(x).diff().mean()
	Timedelta('0 days 00:00:01.001250')

The table recorded values slighter longer than a second's frequency. That's not gonna fly. It's not totally unusable - the miniscule time delay won't invalidate the recorded data, it just will upset the prediction model. I could just have the CSV writer round the current time to the nearest 15-minute interval. But I'd rather have a system that I can put more confidence in.

One other issue is that I think scheduled times are not centered in any way on even 15-minute marks. Even though entries will be 15-minutes apart, they may fall between th *00/15/30/45* marks. The sample `trend.csv` appears to be pretty close, but I don't see any calls to `NAEMonitoring.py` in other scripts so I imagine that the recording script has to be manually started (potentially at the wrong time of the hour).

I think the crontab file I discussed a couple weeks ago would be better suited to schedule tasks according to clock time rather than elapsed time. I saw at least one reference to crontab from the `celery` library that Jordan noted he had briefly tried implementing. That may be an area I could look into completing (or we could just manually add a recording task to the crontab file). I'm just going to do some research on task scheduling in Python and see what comes up.

### Schedule.py
The schedule module is supposed to offer cron-like functionality but I can't see how to use it to run a task every 15 minute mark. It looks like it can only run at specific times of day, not times of the hour.

### APScheduler
I found it from [this post](https://stackoverflow.com/questions/22715086/scheduling-python-script-to-run-every-hour-accurately). It can use `'cron'` as a trigger so it should offer the functionality I need. In my case I want the trigger parameter to be `minute='*/15'`

I tried a similar test from before:

	from apscheduler.schedulers.blocking import BlockingScheduler

	s = BlockingScheduler()
	x = list()

	@s.scheduled_job('cron', second=('*'))
	def task():
	    time = datetime.now()
	    print(time)
	    x.append(time)

	def start():
	    try:
			s.start()
	    except(KeyboardInterrupt):
			s.shutdown()

and got a smaller delay when letting it run for a few cycles:

	>>> pd.Series(x).diff().mean()
	Timedelta('0 days 00:00:01.000427')

The benefit is that my cycles are practically centered on my desired trigger times. I will need to apply some kind of rounding to the times to ensure that they are compatible with the model.

## Rounding datetimes

I made this rounding function that will round a `datetime` object by a desired `timedelta` resolution.

	def round_datetime(dt, res):
	    td = dt - datetime.min
	    td_round = res*round(td/res)
	    return td_round + datetime.min

Using that function on a new set of rounded data yields the following:

	>>> pd.Series(x).diff().mean()
	Timedelta('0 days 00:00:01')

Perfect 1 second intervals. In the final code we'll be using `timedelta(minutes=15)` as the rounded and scheduled intervals.


## New recording system
Rather than making and writing a bunch of seperate data requests, I want to make all the data requests in a tight loop and write all the results at once.

To do this I made a `pandas.DataFrame` of properties that are desired to be recorded. I'm ommiting the school name for now since this script will just be for recording AHS data.

	AHS_props = pd.DataFrame(
		    [("Main (kW)",3007360),
		     ("DHB (kW)",3017359),
		     ("DG (kW)",3017523),
		     ("DE (kW)",3017605),
		     ("DL (kW)",3017769),
		     ("M1 (kW)",3017441),
		     ("AMDP (kW)",3017687),
		     ("Main (kWh)",3007361),
		     ("DHB (kWh)",3017360),
		     ("DG (kWh)",3017524),
		     ("DE (kWh)",3017606),
		     ("DL (kWh)",3017770),
		     ("M1 (kWh)",3017442),
		     ("AMDP (kWh)",3017688)],
		     columns=['Name','Identifier'])

Next I wrote some functions that work with the property table:

	def init_csv(props):
	    with open('trend.csv','w') as csv:
			csv.write(','.join(['Timestamp']+list(props.keys())) + '\n')

	def get_value(identifier):
	    return random.uniform(0,10000)
	    
	def write_prop_values(props):
	    resp = [str(get_value(id_)) for id_ in props['Identifier']]
	    now = round_datetime(datetime.now(),timedelta(seconds=1))
	    with open('trend.csv', 'a') as csv:
			csv.write(','.join([str(now)]+resp) + '\n')

You'll notice that the `get_value` method just returns a random number. Eventually, this will look more like a modified version of `analog_value_request` where it returns the BACnet response value (and not writing it straight away).

The `init_csv()` method just sets up the initial column headers and `write_prop_values()` requests the data and appends a new entry.

I modified my testing `task()` function from earlier to just make a call to `write_prop_values(AHS_props)` every second. Sure enough, after letting the job run for a few seconds I got a nicely formatted trend file:

{{< linked-img "trend.png" >}}

All that's left is to hook `get_value` up to the proper return value (which may be easier said than done since I've never used the `NAEInteract1.py` script on AndoverNET, for all I know it could just throw errors.

	def get_value(identifier):
	    """Request the current analog value of the name/ID property pair

	    Parameters
	    ----------
	    identifier : int
			The identifier number of the sensor from which the
			reading will be taken
	    """
	    global object_destination
	    global value
	    new_request = ReadPropertyRequest(
			objectIdentifier=("analogInput", identifier),
			propertyIdentifier="presentValue")
	    new_request.pduDestination = object_destination
	    this_application.request(new_request)
	    run()
	    return value

This is what I imagine the method should look like. Tomorrow I'll be at the school to see how it works.
