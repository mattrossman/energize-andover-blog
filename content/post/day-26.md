---
author: "Matt Rossman"
date: 2017-07-12
title: Day 26
description: Quantile translation for an adjusted data set
weight: 10
---

#### Wrapping up from yesterday
Before I go on, I was thinking more about the importance of the quantile residual plot. The benefit of using the local extrema of this chart is that they identify the points of greatest dissonance between the sample and model. On [Day 23]({{< ref "day-23.md#flagging-the-high-points" >}}) we picked the 95th percentile of the model and found it correlated to the 86th percentile of the sample. But that was just a nice sounding threshold. The local min on that quantile difference plot would be the best area to highlight since it shows the most dissonance. We weren't far off from the ideal value; we tracked an 8.5% data surplus in the sample at the 95th percentile of model. According the the plot, the most extreme difference was 8.63% which occured at the 95.7th percentile.

I'd be curious to compare the locations of the extrema on this plot to the points of intersection in the density plots.

Also in order for this system to be really useful, we need to be sure that the fitted model is right. It looks nice for the main power data during school hours, but some other plots don't look quite as nicely fitted.

# Quantile Translation
Theoretically, the models that we've been fitting thus far should provide better energy usage than the samples they're based on. To prove that, I want to fit the data set to our model and compare the energy usage of those two data sets. Viraj explained that this could be done by translating the quantiles accordingly. My first approach at this was pretty slow and more complicated than it needed to be. I'll explain how I first did it and how I revised it.

## The Bad Way
First, I needed to figure out the quantile of every value in the data. In the past I've used `scipy.stats.percentileofscore(data,val)/100` to get the quantile of a value, but the disadantage is this only works on a single value, not list-likes. While pandas lets you perform the `quantile` function on a Series to get the value of a given quantile, it doesn't have an inverse version of that function. So I would have to manually apply the SciPy function to each element of the data Seres using `pandas.Series.apply()` or `pandas.Series.map()` (the former is more useful for DataFrames I believe since you can specify an axis).

This is a very slow operation. While most pandas operations are instantaneous, this takes a few seconds to spit out a result. It felt like there should be a faster way to get my results (there is).

Next, I'd have to run *another* mapping of the `stats.lognorm.ppf` to these quantile values to get their corresponding power values in the fitted model. It seemed to work and I tried plotting the results, which brought to my attention another problem. By default, the `percentileofscore` method uses the `'weak'` interpretation of the score, meaning it considers all values in the list that are *less than or equal to* the given value. That's the best method according to the definition of a cumulative distribution function, but it doesn't play nicely with the `.ppf` function. With a lognorm distribution, you can't reach the 100th percentile; it's infinite. You *can* reach the 0th percentile since lognormal distributions have that lower bound of zero, but they stretch infinitely in the positive direction. So for my maximum data value (which by default was recognized as the 100th percentile), the equavalent model value was `inf` for $\infty$. This made it unable to be plotted.

I could have resolved this by simply dropping the value, but it seemed unfair to drop my largest data value. To remedy this, in the `percentileofscore` call I changed the argument for `kind` to `'mean'`, which averages between the `'weak'` and `'strict'` methods. The `'strict'` method would only look at the values *less than* the given values, so the minimum data value would automatically get assigned to the 0th percentile, which in turn would set it to 0 kW. That didn't seem fair either, so the `'mean'` method seemed like the best compromise.

This is what the inefficient approach looks like:
	
	quantiles = data.map(lambda x: stats.percentileofscore(data,x,'mean')/100)
	adjusted = quantiles.map(lambda q: stats.lognorm.ppf(q,*fit_params))

## The Good Way
The problem with the current approach is the usage of mapping. It's an inefficient way to manipulate the large list values. There are two instances of mapping that need to be resolved:

The first is when calculating the data quantiles. Quantiles look at data solely by *count*. That means that since the distance between data counts is constant (it's just 1), the difference between quantiles (just the ranks, not the values associated with those quantiles) is constant too. That is, assuming the data values are sorted (since a quantile counts the proportion of data equal or below it).

So, what is that constant? Well, it depends how I want to set up my quantile ranges. I realize there's some miscommunication between Pandas' `quantile` method and SciPy's `percentileofscore` method. Pandas (and Wikipedia) defines the quartile range as $0 \le q \le 1$. The first and last values are thus fixed to the 0th and 100th percentiles, then everything in between splits up the middle region. But no matter which `'kind'` argument you select, you can't replicate this behavior with `percentileofscore`. If you say `kind='weak'` then your range is $\frac{1}{n} \le q \le 1$. For `kind='strict'` the range is $0 \le q \le 1-\frac{1}{n}$. The `'mean'` method splits the difference of these ranges, and `'rank'` is only used for duplicate element values.

I might as well define the range that I *want* since I won't be needing the `percentileofscore` method anymore. I already explained the disadvantages of allowing the range to include 0 or 1. So I want to evenly distribute the quantiles with a buffer on either end. The affect of a smaller buffer size is more "extreme" values in my adjusted set (i.e. as the buffer size decreases, the maximum value approaches $\infty$). The most straightforward approach I can think of would be to set my range to be $\frac{1}{n+1} \le q \le (1-\frac{1}{n+1})$ with an equal quantile spacing of $\frac{1}{n+1}$. That would effectively put two invisible dummy values on the ends of the set to take the places of the 0th and 100th percentiles and let the actual data be evenly spaced in between.

#### Proof:
Note that you would intuitively think that I should be using $\frac{1}{n+2}$ instead of $\frac{1}{n+1}$ since I'm adding *two* dummy points on the sides, but if you do it out you'll see that due to the inclusive edges it should just be $n+1$. Consider an array `[1, 2, 3, 4, 5]`. Take the quantiles for these values and you get `[0, 0.25, 0.5, 0.75, 1.0]`. The spacing is $0.25=\frac{1}{4}$ or $\frac{1}{n-1}$. Now imagine you're just looking at the subarray `[2, 3, 4]`, and the `1` and `5` values are your buffer dummies. The spacing should be the same as before so your output quantiles are `[0.25, 0.5, 0.75]`. Now that $n=3$ you can see this spans the range $\frac{1}{n+1} \le q \le \left( 1-\frac{1}{n+1} \right)$.

More generally, given a buffer of $b$ points (on each side), your range should be $$\frac{1}{n+2b-1} \le q \le \left(1-\frac{1}{n+2b-1}\right)$$

#### Code
First step: sorting the values. I can do this efficiently with `pandas.Series.sort_values()`.

Next step: assign the desired quantiles to these values. I can generate the range of quantile values using the equation above and `numpy.linspace()`, then assign it an index and re-sort:

	data_sorted = data.sort_values()
	buffer = 1
	step = 1/(data.size+2*buffer-1)
	quantiles=pd.Series(np.linspace(buffer*step,1-buffer*step,data.size),
		            data_sorted.index)
	quantiles.sort_index(inplace=True)

This part would have been a lot shorter if I just hard-coded the buffer size of 1, but I may want to tweak that later on so it's a bit more future-proofed.

Lastly we need to get the inverse of the CDF on these values from the lognorm distribution. The revision to this step is simple since the `.ppf` function lets you pass in an array of values so there's no need to use a map function.

	adjusted = pd.Series(data=stats.lognorm.ppf(quantiles,*fit_params),
		             index=quantiles.index)

# The Result
{{< linked-img "adjusted.png" >}}

The plot shows the distribution of the new adjusted sample against a density histogram of the original data. It also shows how the adjusted sample follows the fitted model almost exactly. I'm guessing the small amount of error could be adjusted by changing the buffer size. Visually you may wonder what this even accomplished since it looks just like the fitted plot. However, the benefit is that now we have tangible data to work with as opposed to just some SciPy distribution parameters.

So, if I want to compare the energy usage of the two data sets, I can check `egz.trapz(data,'15 min')` against `egz.trapz(adjusted,'15 min')`. Here's an output showing the difference:

	Sample: 320679.0 kWh
	Model: 312584.0 kWh
	Saved: 8095.0 kWh

So in that case the fitted model saved about 8,100 kWh of energy, which is about 2.5% of the sample's energy usage. That doesn't seem like a huge amount, but it's realistic. Also this is just relying on squashing outliers, it's not intended to shift the center point of the data so it can't cause massive changes in energy usage.

For the future, I should abstract this process and also look at how the shift affects the daily power plots.
