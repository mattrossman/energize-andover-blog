---
author: "Matt Rossman"
date: 2017-06-26
title: Day 15
description: Team meeting, researching distribution functions and tests
weight: 10
---

Today we got to hold our first real team meeting. Frank and Ajay joined me at the library, and I spent time explaining some of the work I had done and sharing the basics of how to use Pandas. For now I'm suggesting they spend time setting up Anaconda and Pandas and get a feel for how to use DataFrame and Series objects.


In the meantime I'll continue working with probability distribution functions.

#### Kolmogorov–Smirnov test
Over the weekend I came across a statistical test designed for comparing probability functions. It's called the [Kolmogorov-Smirnov test](https://en.wikipedia.org/wiki/Kolmogorov%E2%80%93Smirnov_test), or K-S test for short.

[This page](http://www.itl.nist.gov/div898/handbook/eda/section3/eda35g.htm) warns that it is not valid when the distribution is estimated. I assume "the distribution" refers to the one being compared against. I am unsure of how this applies to our situation, since in a way we are estimating the underlying normal distribution. [This other page](http://influentialpoints.com/Training/Kolmogorov-Smirnov_test_use_and_misuse.htm) also says not to use the K-S test when your expected normal distribution is estimated from the sample. Instead it recommends *Lilliefors test* if I decide to use the estimated normal distribution. I think that's enought to convince me that the K-S test is not the best option.

#### Other distribution tests
The K-S test is just one of many statistical methods to compare data distribution. [Here's a list of other such tests](https://en.wikipedia.org/wiki/Goodness_of_fit#Fit_of_distributions). It's pretty overwhelming how many options there are, and each test has a very specific purpose. I'm going to spend some time reading up on each of them.

#### Research paper on abnormal stock trading 
I came across [this interesting research study](https://www.researchgate.net/publication/5157842_Measuring_Abnormal_Daily_Trading_Volume_for_Samples_of_NYSEASE_and_NASDAQ_Securities_Using_Parametric_and_Nonparametric_Test_Statistics) on analyzing abnormal stock trading patterns. It's a lot of dense information to sift through but it could prove very useful. It seems to be tackling a very similar problem statement.

#### Non-parametric tests
I have learned to distinguish between *parametric* and *non-parametric* tests. Parametric tests assume an underlying normal distribution, while non-parametric ones don't. So far you could say my work has been more like the former since I assume that the power usage should be normal. I should emphasize that this is not set in stone and I am very open to trying non-parametric methods since I don't know what the ideal population distribution should look like.

I have more to talk about but not enought time to write it all down. More to come tomorrow.

