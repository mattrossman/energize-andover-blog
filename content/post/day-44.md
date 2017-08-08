---
author: "Matt Rossman"
date: 2017-08-07
title: Day 44
description: Index windows, more input features (holidays, descriptive stats, time data), trying non-default hyperparameters, flagging anomalies
weight: 10
---

## Adding features
#### Index windows
In order to avoid doing extra work I wanted to switch to using value indexes for my windows as opposed to rolling across the raw data. This way I can reuse the indexes of these windows later to pull other information from the same sections of the data (things like day of the year, day of the week, etc). 

Here's an example of adding day of the week features (about the *target* values) to my input array.

	ixs = np.array(range(len(data)))

	ix_windows = egz.rolling_window(ixs,input_size+gap_size+output_size,output_size)

	def index_data(ixs_arr,data):
	    return np.apply_along_axis(lambda ixs: data[ixs],0,ixs_arr)

	X_ixs,_,y_ixs = np.split(ix_windows,[input_size,input_size+gap_size],1)
	X = np.concatenate((index_data(X_ixs,data),index_data(y_ixs,data.index.dayofweek)),1)

	y = index_data(y_ixs,data)

This had a minor improvement to my model (Median APE from 0.149 -> 0.146).

I added in some more features including whether or not the building is occupied:

	occ = pd.Series(0,data.index)
	occ[occ.index.intersection(egz.df_school.index)] = 1

	X_ixs,_,y_ixs = np.split(ix_windows,[input_size,input_size+gap_size],1)
	X = np.concatenate((index_data(X_ixs,data),,
		            index_data(y_ixs,occ),
		            index_data(y_ixs,data.index.dayofweek),
		            index_data(y_ixs,data.index.month)),1)th)),1)

This brought the Median APE down to 0.139. The occupancy implementation is flawed, as I'm supposed to be feeding the model completely true information. However, I only have school session information starting in September of 2016, so I'm lying about the occupancy in the 2015 and early 2016 data. Additionally, there are times when the school is occupied but school is not in session. I may be better off simply having a variable set for the entire day, 1 if that day is a holiday or 0 if not (and another variable for half days).

I implemented that as follows:

	no_school = pd.Series(0,data.index)
	no_school[np.where(np.in1d(data.index.date,
		                 (egz.time_filter(
		                         no_school,include=(egz.no_school
		                                            +['2/9/17','2/13/17','3/14/17','3/15/17']
		                                            ))).index.date))[0]] = 1
	    
	half_day = pd.Series(0,data.index)
	half_day[np.where(np.in1d(data.index.date,
		                 (egz.time_filter(
		                         half_day,include=egz.half_days)).index.date))[0]] = 1

**Note:** to be more strict about the data I'm using, I'm currently just testing/training on sets of the data within the '16-'17 school year (so that I'm not ignoring the academic calendar for the rest of the data)

## Testing the features
I spent a bunch of time just trying different combinations of features on the data and seeing what got the best results.

I actually found that after adding some more features, the model performs significantly better when predicting an entire day of data rather than just an hourly chunk. I'm keeping the gap at 1 day and the input at 4 weeks. Also, I noticed a slight improvement after downsampling the input data to hourly intervals.

You'd think that adding all possible features (giving the model the most data to work with) would always increase the accuracy, but that is not always the case as I saw last time. Additionally, some changes would appear to make a better fit and would decrease the MAPE but would actually increase the median APE. For instance, when I realized that I wasn't adding the extra snow days to my `no_school` array my median APE went from a solid 0.11 up to 0.13, while the MAPE went from 0.19 to 0.18. I'm going by the assumption that an improved MAPE trumps an improved median APE since it's important to account for those outlier days.

Adding the half-day variable somehow made both the median and mean APE perform worse so I'm excluding that info for the moment.

## A note on randomness
I was surprised to see that changing the order of the features affected the MAPE and median APE scores.

I have been setting `random_state` (the seed for the random forest) at a constant value accross trials to try to be consistent with my scoring. I guess changing the features in turn changes the way the seed behaves, so my scores comparing the features are not really consistent since they're coming from different trees.

For instance, maybe adding the half day variable *doesn't* actually hurt my model in the long run, it's just that that particular tree performed worse than the previous one.

I'm wondering if there's a built-in way to run numerous trials and create a confidence interval for the score values so I can more fairly judge my features.

## Current feature set
I added in a couple more metrics (things like mean of past 4 weeks, min and max, etc) which may just be presenting redundant information but it didn't seem to hurt the model either. Here' the feature construction at the moment:

	X = np.concatenate((np.std(index_data(X_ixs,data),axis=1).reshape(-1,1),
		            np.median(index_data(X_ixs,data),axis=1).reshape(-1,1),
		            np.min(index_data(X_ixs,data),axis=1).reshape(-1,1),
		            np.max(index_data(X_ixs,data),axis=1).reshape(-1,1),
		            index_data(y_ixs,no_school),
		            index_data(y_ixs,half_day),
		            index_data(y_ixs,data.index.weekday),
		            index_data(y_ixs,data.index.dayofyear),
		            index_data(y_ixs,data.index.hour*60+data.index.minute),
		            index_data(y_ixs,data.index.month),
		            index_data(X_ixs,data)[:,::4]),1)

## Playing with the hyperparameters
So far the only hyperparameter I changed from the default is `max_features`. I actuallly [read that for regression problems](http://scikit-learn.org/stable/modules/ensemble.html#parameters) it's better to leave this as the default of $n_{estimators}$. The other significant parameter I've ignored is `n_estimators` which defaults to `10`. I upped this to `40` and got significantly lower variation across random trials.

## Metrics
To detect anomalies I'm going with the RMSE as an estimate of the predictions' standard deviation from the true values. I'll then use $2\sigma$ as a threshold for acceptable values. Sklearn can do the MSE for you with `sklearn.metrics.mean_squared_error`, so I just have to take `np.sqrt` of that value and multiply by 2.

## Update on the plot
Here's how the model looks with its latest upgrades:

{{< linked-img "rf_anomalies.png" >}}

I showed off this section of the test data since you can see how it handles school days, weekends, anomalous behavior, and holidays.

You also might notice that the x-axis is actually readable now, as the units track the dates. I did this by creating another set of arrays:

	dates = index_data(y_ixs,data.index)
	dates_train,dates_test = np.split(dates,[num_train])

and setting my axis to `dates_test.ravel()`.

I am very pleased with how it is looking currently. It handles weekends and holidays very well. The predictions are fairly consistent and look reasonable. The only hitch at this point is having to manually specify holidays and half days. I don't know if clustering will help us take care of that automatically or if we'll just have to settle for importing an `.ical` file.

#### A couple last notes
I was playing around with the input/gap/output parameters with the new features implemented. I noticed that increasing the gap size doesn't have a huge impact on the model as it did before. That gives us some flexibility with how far we want to predict ahead of time (e.g. if we want to have our predictions a week or more ahead of time, that's probably doable)

More shockingly, I removed the previous power usage feature entirely and even that had minimal impact on the fit. That could potentially speed up training significantly. I've spent enough time fiddling with parameters today. Tomorrow I'll be presenting some of the work we've done so far with some other team members so I've got to prepare the presentation for that.
