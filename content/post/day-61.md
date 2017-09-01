---
author: "Matt Rossman"
date: 2017-09-01
title: Day 61
description: Successfully logging data, verifying compatibility with prediction process
weight: 10
---

## Wednesday
The past two days weren't productive enough to warrant their own posts. Wednesday I met Kevin and the rest of the team at MHL hoping to gain insight on how to use the logging scripts. Unfortunately, Jordan is pretty much the only one who really knows how to use them. I had hoped that the address error would go away on AndoverNet but it persisted.

I emailed Jordan looking for guidance, and he said that I would have to change the IP address listed in `BACpypes.ini` to the one of my own computer. At this point I was off the network, but even on my home network I noticed that this made the error go away. Instead I was stuck unable to interact with the iPython console.

## Today
I tried this on AndoverNet at AHS, and instead of the terminal locking up it spat out some confirmation of the configured settings before granting me control. And when I made a call to `analog_value_request`, I actually got a value back!

Then I tried using my draft modified logging script and it worked great, just like it did when hooked up to the random value generator. Since I don't want to spend a ton of time testing, I added in a `BlockingScheduler` set to a `cron` trigger every 15 seconds. I let it run for a while, and here's what I got:

{{< linked-img "trend_test.png" >}}

You may notice that there are some entries where the values appear to be duplicates. This is probably just a result of the update rate of the sensors. At a broader resolution (e.g. 15 minutes) this will not pose an issue.

There's a bit of a hiccup when trying to re-run the scheduling script. BACpypes throws an error about the address already being in use, but re-starting the kernel solves this.

I'm going to run the scheduler script in the background for a while at a one-minute resolution to double check that it's working alright.

#### Testing the predictions
You wouldn't normally make a forecast with such a small data set, but after 20 minutes I wanted to try out the prediction model. I set the input, gap, and output size to 5 minutes and used minutes as a time attribute (though I doubt adding that had any predictive power). Training and prediction went smoothly, but one odd thing about the output tables was that the columns were out of order. It looked vaguely alphabetical but not completely.

I fixed this by switching to using an `OrderedDict` rather than a regular `dict` to store the models. I had to change this during model construction as well as after the multi-core training process. Regular dicts will try to alphabetize their returned `keys()` or `values()` lists, which I don't want to happen when I'm iterating over them.

Going forward, it's entirely possible to continue performing the data logging this way. I'll probably leave the team with my draft copies of the modified logging and schedule scripts. There's no point writing a particular prediction script yet since the real server isn't available to start the data logging. Future work will also have to be done to allow the server to graph the newly formatted data logs and corresponding prediction values.
