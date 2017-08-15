---
author: "Matt Rossman"
date: 2017-08-14
title: Day 48
description: Adding extra features to the model, streamlining the training and prediction process
weight: 10
---

## Today's plan
I'm mainly ironing out the details of the model implementation today. Rather than copying all the code here, I've moved the model class (now called `RandomForestModel`) into the energize module.

I had a brief scare today when I thought my window calculations were all wrong, but I realized it was a simple mistake of limiting my working `data` to start at `egz.df_school.index.min()` when it should have been `egz.df_school.index.date.min()` (to preserve the 00:00:00 start time)

## Considering how to include additional features
Last time my model accounted for two features: historial true values and time features of the target values. Besides that there are additional features the user may want to consider such as building occupancy or temperature.

I can see these types of features being classified in two ways. First there are features that broadly apply to the target region (e.g. the state of being a holiday is the same for every data point in the 24 hr output region). Then there are features that may vary throughout the output region (e.g. the building may be occupied only for some hours of the day).

Currently the implementation of time features acts like the first description - only the first element in the output region is included as a feature since it assumed to be constant for the whole day.

Rather than creating two seperate parameters for region-spanning and intra-region extra features, perhaps there could be one variable that takes in a list of feature tables and reads the frequency specified by the index of each to determine what frequency should be used as features. The benefit of this is the features could each be sampled at arbitrary frequencies (as long as that frequency divides the output region size cleanly)

The trouble with implementing this is that the windows use integer based indices, which would not line up with the extra-feature tables since they are at different frequencies.

Random thought that I need to consider - the integer-index window approach requires that all the feature tables start at the same point in time. A clean way to get around this would be to form the windows from dates rather than integers. As I mentioned a few posts ago, I don't there's a simple way to get the window bounds from a Pandas `rolling` object. Perhaps I could just roll across the data index rather than what I'm currently doing (rolling across a range equivalent to the length of the data to generate integer indices).

Another thing to consider - should I have the model take in a list of extra feature tables, each at their desired frequencies, or should there be a single large table, entirely at the data frequency with `Nan`'s as placeholders to simulate different frequencies among columns? (i.e. a single DataFrame where one column might be a variable that changes hourly while another column may have daily incremented values). I thought the first would be easier but the second sounds more robust and clean.

To deal with the inconsistent column frequencies, once I select a region with one of the `y_ixs` windows I can `stack()` that sub-frame and then get a flattened copy from its `values` attribute. The only problem is that if the feature frequency is lower than the output window size, only some windows will contain all of the features. To resolve this I have to foreward fill values at a minimum frequency of the output window size (i.e. 1 day in my case).

I did test this out by setting the column equal to a new DataFrame with the index as a `date_range` sampled at `td_output` and the data as the column with `Nan` values dropped. However I'm going to skip implementing this extra step since it's perhaps just as easy to just pass in an upsampled table upfront. That means the extra feature table can handle features at a higher frequency than the output window, but for features at a lower frequency it's up to the user to upsample the data.

## Making new predictions
My initial attempt at next-prediction implementation returned a date for the day predicted along with an array of predicted values. I changed this to simply return a Series of predicted values with an appropriate DatetimeIndex. To make the predictions I have a `input_vector` function

## Today's result
I made some good progress with the `RandomForestModel` class today. It's now a very straightforward to make a model from existing data and create the next prediction. I'll walk through an example of the process.

First you create the `RandomForestModel` object:

	model = egz.RandomForestModel(
		    data,
		    td_input  = timedelta(weeks=4),
		    td_gap    = timedelta(days=1),
		    td_output = timedelta(days=1),
		    sample_freq = timedelta(hours=12),
		    time_attrs = ['dayofyear','dayofweek'],
		    extra_features=extras,
		    n_estimators=100)

Then you train the model:

	model.train()

Finally you can make the prediction:

	model.next_prediction()

{{< linked-img "rf_model_demo.png" >}}

## Todo
- Add a way to get the variance of the predicted values (it should be outputted in a corresponding Series, or perhaps as a DataFrame along with the predictions)
- Figure out how to schedule scripts to run on the server
- Clean up the energize module, get rid of or move unused functions
- See if it's worth transforming the energize module into some kind of package? (never made them before so I don't know)
