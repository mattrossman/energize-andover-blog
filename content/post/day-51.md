---
author: "Matt Rossman"
date: 2017-08-17
title: Day 51
description:
weight: 10
---

## Resolving yesterday's mystery
After some testing I realized the only difference in the CSV-writing script's approach was that I had ommited temperature data, having come to the conclusion earlier that it hurt the prediction performance. That may have been the case for the particular day I was looking at, but on a larger scale (such as the 4-day test region) I guess it actually improved performance.

When I added the temperature data back to the features table I got a more familiar result:

{{< linked-img "with_temp.png" >}}

Some columns still have difficulty with predictions, especially the Collins Center. This could be improved with more detailed occupancy data. This brings to my attention the possibility that some columns of a `MultiRFModel` may require specific extra features. I still want to keep some extra features communal (since all columns will likely depend on common factors like holidays or temperature), but if certain columns are only contained in specific parts of the school (with specific occupancy schedules) then all the other occupancy data would just add noise to the predictions. Perhaps the `MultiRFModel` could have an addition argument that contains a list of unique feature tables that apply uniquely to each column.

I added it by creating a different `_get_training_arrays()` method for `MultiRFModel` that includes the additional `column_features` attribute. I also added some validation steps in the class initialization function to allow the user to only pass in additional tables for some columns, or for none at all.

#### Inferring data frequency
I made some changes to how data is handled to allow the user to pass in data with an unspecified frequency. I also learned that `pandas.read_csv()` has a `parse_dates` parameter that you can set to `[0]` to automatically parse the index column dates as datetime objects - pretty handy.

#### Switching to slice based windows
At the moment the training windows contain a big list of index values. In reality I only need the start and end date of each window, and to use a slice with those endpoints. I'll start by getting this from just the `min()` and `max()` of the existing windows and making sure that it doesn't break anything. Then I'm curious if I can rework the window generation step so that it doesn't need to store all the in-between dates (that might just be a waste of processing power and memory to store all those datetime objects).

I got it working with slices with the min/max technique. As far as I can tell the in-between dates are only stored temporarily in the `_get_training_windows()` method before being reassigned by the slice endpoint indicies. Computationally it's not demanding to calculate them since it still uses NumPy strides. If anything, using slices runs the extra step of calculating the min/max of each window. However, the benefit of using slices as opposed to regular lists of indicies is that the slice indicies don't need to be contained in the target data index. That is, a feature table can be at a different frequency than the power value table without any errors being thrown. Even though previously you could pool feature columns that were at different frequencies, the entire table still had the be at the same frequency as the data (so there would just have to be a bunch of blank spaces). Now you can do without those blank spaces.

## Larger scale test
This time I tried a test of the multi-model on all of the AHS data I have. I excluded the extra features since I don't have any future data for them. In practice there would only be a couple of extra features so the performance would not be very different. At a daily power sample frequency it took about 23 seconds to train the model. At a weekly sample frequency it took about 13 seconds.

#### Sample frequency implementation
When I say sample frequency, I mean the way the model selects historical values to use as features. It can be pretty demanding to use every power sample from the past 4 weeks as a feature, so I instead take a power value from every hour or day. That ignores a lot of information though. I may be better off aggregating the values in each sample pool rather than dropping all but the first element. I'll start my taking the mean of each pool.

#### Working with missing power data
Currently I've been running a single pass of the sample data, filling in data from the week before where there are missing values. What if that's not enough to get rid of all the blank spots? Or what if the current implementation makes the model weaker by adding fake data? One way to counteract this is to have the model *not* train on windows that include missing values. That way it stays ignorant about topics it doesn't know about rather than being potentially misinformed. I'm having some trouble implementing this (NumPy logic will make your head spin after looking at it too much) but I'll get back to it some other time. It only becomes an issue if you have lots of missing data and don't take precautions for it.

#### Warm starting?
Not an idea that I want to implement right now, but the `warm_start` argument of `sklearn.ensemble.RandomForestRegressor` would be a potential way to save a lot of processing power. Rather than building a new forest each time, it reuses the old forest and adds some more estimators to it. Since the only difference between nightly models is 1 day's worth of power data, it would save a ton of redundant calculations. Granted, making a new model every day ensures that the random forest is really random. Also I don't have to worry about keeping the same script running in the background all the time. It's not a big priority but maybe something I could check out in the future.

## Documentation
I started documenting the classes at the start but I've made a lot of changes since then. I'm going to spend some time going through and documenting what the attributes and functions do so others can follow along.

I finished documenting the `BaseModel` methods, and as I did so I caught a couple bugs. I also found areas I'd like to improve next time, mainly with the training array generation step which is a bit messy at the moment.
