---
author: "Matt Rossman"
date: 2017-06-29
title: Day 18
description: Scipy, calculating the best fit distribution
weight: 10
---


The primary library in Anaconda for performing complex scientific calculations is `scipy`. It includes 82 built-in distribution functions. You can test how well a distribution applies to a sample using the `fit()` function.

Someone online was nice enough to write [a script that iterates over every included distribution function and finds the best fitting one](https://stackoverflow.com/questions/6620471/fitting-empirical-distribution-to-theoretical-ones-with-scipy-python). This calculation takes quite a while to run. I tried running it on the Main power data with my school hours filter:

{{< linked-img "all_school.png" >}}

{{< linked-img "best_fit_school.png" >}}

Scipy says that the [Johnson $S_U$](https://en.wikipedia.org/wiki/Johnson%27s_SU-distribution) distribution is the closest fit across all Main power entries. Perhaps that distribution could serve as a reference for subsets of that data.

I was hoping I could just use a normal distribution as the reference for my time slices, but it doesn't seem to be effective. Scipy has a `normtest` function that calculates the P-value of a sample coming from a normal population ([documentation](https://docs.scipy.org/doc/scipy/reference/generated/scipy.stats.normaltest.html#scipy.stats.normaltest)). Everything I feed to it generates an extremely small P-value (like, numbers to the power of -60), so even if I set $\alpha=0.01$ every sample would be considered abnormal. I know that the function works though, because if I generate a normal sample with numpy it gets acceptable P-values.

#### A second glance at the Kolmogorov-Smirnov test
I spent a lot of time taking a second look at the Kolmogorov-Smirnov test. Scipy has KS tests built in but it was a trick to set up my distribution as a *callable CDF*. I figured maybe I could use the Johnson $S\_U$ distribution that was calculated earlier and compare subsets of my data to that, however I'm still paranoid that this is not statistically valid.

I already mentioned that when testing normality with KS you shouldn't estimate the population distribution from the data. But Wikipedia goes so far as to say that whatever the distribution, [it shouldn't be estimated from the sample](https://en.wikipedia.org/wiki/Kolmogorov%E2%80%93Smirnov_test#Test_with_estimated_parameters). I suppose it depends what I define as "population" vs "sample". Is my population just all of the data that I have (i.e. a population would be something like `df_school['Main (kW)']` and a sample would be just the data on a certain day or from a certain time)? If I'm being really strict, the "population" data would be an infinite number of power recordings starting at the origin of AHS.

So everything I have is just a sample, and stratifying that data just makes smaller samples. Wikipedia isn't explicit about the restrictions on a 2-sample KS test, but [this forum post](https://math.stackexchange.com/questions/1422394/how-to-test-whether-a-subset-is-representative-of-a-population) says you can compare a sample with a subsample that way. A random internet post isn't the most trustworthy source, but I'd rather be safe than sorry.
