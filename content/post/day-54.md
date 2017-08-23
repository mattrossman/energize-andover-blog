---
author: "Matt Rossman"
date: 2017-08-22
title: Day 54
description: Logging the model properties, considering the implications of various energy savings quantification methods
weight: 10
---

## Finishing touches
I considered moving all the model parameters over to the appropriate `train` methods since it seemed unecessary to lay out all the model settings at instantiation. Hoever, I thought some more and realized that many of those parameters are common to the `train` and `predict` processes, so it makes sense that they be tacked on to the object instances rather than passed as temporary arguments. Properties like the input/output/gap size are not just temporary uses for a model, they are defining characteristics for how that model is set up. Therefore it is somewhat intuitive to keep them as initialization parameters.

If for some reason it is desired to reuse a trained model, I added `reload_data` methods to both classes. This allows the historical data and feature tables to be updated to allow the model to make predictions farther in the future as new data is recorded.

## Logging predictions
As predictions are made it would be helpful to have a log of what settings were used for each prediction.

I added `BaseModel.to_string` which converts a range of value types into useful strings (e.g. reading the list of column names from a DataFrame, formatting dicts). Then the models have a `log` method that generates a Series of these formatted strings, indexed by attribute name from a big list of selected attributes. I also manually added some other data, like useful timestamps.

Here's an example of a prediction log (I don't actually use those column features, I just wanted to demonstrate the formatting).

	>>> model.log()
	timestamp                                 2017-08-22 15:24:41
	pred_start                                2017-03-20 00:00:00
	pred_end                                  2017-03-20 23:45:00
	data_start                                2016-09-02 00:00:00
	data_end                                  2017-03-18 23:45:00
	n                                                       19008
	data_freq                                     0 days 00:15:00
	input_size                                   28 days, 0:00:00
	gap_size                                       1 day, 0:00:00
	output_size                                    1 day, 0:00:00
	sample_freq                                    1 day, 0:00:00
	sample_agg_method                                        mean
	time_attrs                               dayofyear, dayofweek
	extra_features                                 noschool, temp
	est_kwargs                        n_estimators:100, n_jobs:-1
	column_features      Main (kW):TMAX, Lighting (kW):TMIN, TMAX

The idea would be to add an entry like this (the left-hand side would be headers in a table, the right would be the actual log data) every time a prediction is made. Most likely this information would not change drastically day to day, but if administrators or future students decide to modify the prediction process then the old predictions will still have some context. Perhaps whatever script ends up performing the logging could check for duplicates in the columns to avoid storing redundant information.

## Quantifying energy savings
It may seem simple to quantify the surplus of data compared to its forecast. If you have a list of true values, and a list of predicted values, you would expect to just take the difference of the two.

#### Studentized residuals
[According to Wikipedia](https://en.wikipedia.org/wiki/Normalization_(statistics)), studentizing residuals means *"normalizing residuals when parameters are estimated, particularly across different data points in regression analysis."* This involves dividing each residual by its estimated standard deviation. Note that during regression I treat the output period like one big variable, but after that I treat each output point as a separate variable. I'm not sure exactly how scikit-learn treats multi-output regression problems, but from what I understand standard procedure is to treat it like a bunch of smaller regression problems anyways.

I want to break down the interpretations of different parts of the forecasting process. I'll focus on a single column of data. Each column has a random forest assigned to it. Within this forest there are many trees. Each tree tries to find optimal branching points among the input variables to reach different outputs. An output of the tree is a guess at the corresponsing true value based on its properties as learned from previous true cases. Each tree will arrive at a different conclusion based on how it was grown. With enough input data, and assuming the provided proprties are sufficient predictors of the output, then each tree should represent a valid potential outcome of the output variable. The variance of the forest's outcomes represents the uncertainty of a prediction based on the provided input properties. Nonetheless, it is expected that the true value would lie in the range of potential outcomes.

Now I must pause to discuss another topic:

#### Confidence intervals
Consider a 95% confidence interval. This means that 95% of the time you make that interval it will contain the true value. Each time I train a model I get a new forest with a different confidence interval, but 95% of the time that interval should contain the true value. Hence when a value falls outside the interval, it is considered a rare occurence. But is the anomalous behavior coming from reality or from the model? I think it's safe to say that if the model has been trained on non-anomalous (say that 5 times fast) data, then the model is not to blame. That has been my assumptiont thusfar (I previously set a $2\sigma$ threshold as an identifier of power anomalies)

The reason I talk about this is that when residuals are studentized, there's not an intuitive way to quantify them. They no longer have units of kW or kWh. One way to measure potential savings is to truncate values at the upper threshold of the confidence interval, and say that you're 95% sure that this should be the maximum usage for that period.

I've tried reading further into interpretations of studentized residuals but the language starts to get beyond me.

Originally, the reason I didn't like regular residuals was the fact that you'd have more "potential savings" from areas with high uncertainty, making the "potential savings" more of a measure of uncertainty than a truly conservative estimate of how much you could expect to save. On the other hand, it's intuitive to think that for conditions with large variability, it takes less effort to make big changes (basically the definition of variance). So my efforts to somehow scale the savings estimates may have been unecessary altogether. Assuming that all data above the prediction is bad usage would essentially correspond to a 0% confidence interval, assuming the intervals are centered.

What if the intervals aren't centered though? For instance, can you say that the interval $(\infty,\mu)$ is a 50% confidence interval? I think so, and I think that would be an even better interval to use since I don't care about abnormally low power usage.

At the moment, the best I can come up with is to have one idealistic sum of the "potential savings" (with the assumption that the building will perform exactly the same way under the same conditions) which just totals up the areas where the true values surpass the predicted ones, and then a second more conservative measure of "expected savings" that tells you the minimum savings you can expect at a certain confidence level. The downside of this conservative measure is that it ignores all potential savings from the data points that fall below the threshold. In the back of my mind I still feel there's something missing here though.

As a side note, I think it would be better to calculate the z-thresholds using a t-distribution rather than a normal distribution since I'm not using an infinite number of estimators with infinite possible outcomes (I think the degrees of freedom would just equal the number of estimators I have, I'd have to verify that).
