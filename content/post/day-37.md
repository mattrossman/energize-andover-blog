---
author: "Matt Rossman"
date: 2017-07-27
title: Day 37
description: Cross validation intro
weight: 10
---

#### Side note
I found [this neat flowchart](http://scikit-learn.org/stable/tutorial/machine_learning_map/index.html) on the scikit-learn site that guides you through picking an estimator. It basically guided me down the path I expected (on the regression side of things), although it brought to my attention that it may be better to use a Lasso or ElasticNet-based estimator (Huber is closer to Ridge) due to its preference for feature sparsity. That may be beneficial once I start working with mugh higher dimensional inputs. I'll worry about that later since I finally got the robust Huber estimator to work.

## Cross validation
The purpose of validatation and cross validation is to generalize your model making it a better predictor of future unknowns. The danger of simply fitting a model to you whole data set is that it can create a highly fitted model that works very well at predicting the exact sample set you trained on, but it may be bad at predicting values outside of your training set.

In general you want to break your data into training, validation, and testing sets. It can be confusing at first but [this answer](https://stats.stackexchange.com/a/96869/166768) does a nice job of explaining the unique purpose of each division.

*Cross validation* more specifically has the advantage of not wasting any of your data since you recycle data from your training/validation sets across iterations. More info [here](http://scikit-learn.org/stable/modules/cross_validation.html) in the scikit-learn documentation on cross validation.

I also found [this post](https://stats.stackexchange.com/questions/95797/how-to-split-the-dataset-for-cross-validation-learning-curve-and-final-evaluat) to be a very helpful breakdown of to cross validation procedure in sklearn specifically.

## Time series validation
The standard iterative cross validation method in sklearn is [k-fold](http://scikit-learn.org/stable/modules/cross_validation.html#k-fold), however it assumes the data are independent and have a consistent distribution as noted [here](http://scikit-learn.org/stable/modules/cross_validation.html#cross-validation-iterators-for-i-i-d-data).

[This](http://scikit-learn.org/stable/modules/cross_validation.html#cross-validation-of-time-series-data) is the documentation's recommendation on splitting time-series data. The goal is to always evaluate performance on *future* data (i.e. data that is least like your training data). This also means I can't use the standard [`train_test_split`](http://scikit-learn.org/stable/modules/generated/sklearn.model_selection.train_test_split.html#sklearn.model_selection.train_test_split) because it performs a `ShuffleSplit` on the data (the documentation warns against shuffling samples that aren't independent).

## Time Series Split
The (only) iterator for timer series data in sklearn is `TimeSeriesSplit` [(documentation)](http://scikit-learn.org/stable/modules/generated/sklearn.model_selection.TimeSeriesSplit.html#sklearn.model_selection.TimeSeriesSplit). This maintains the consecutive nature of the time series data, and only evaluates model performance on "future" data points.

Example definition: `cross_val = TimeSeriesSplit(n_splits=5)`

## Picking hyperparameters
To pick the optimal hyperparameters via validation I can use `GridSearchCV`. I was having a little trouble figuring out how to make this work with my pipeline, but basically the `GridSearchCV` object *becomes* the estimator that you finish off the pipeline with. So I wrapped my Huber estimator with the grid search and passed in my `cross_val` iterator and my dictionary of parameters. I also set `iid=False` since the data is from a time series, thus it is not identically distributed across my CV folds.

For the aforementioned dictionary of parameters I created the following items:

	alphas = np.logspace(-6, 1, 8)
	epsilons = np.linspace(1.00001, 2, 5)
	params = {'alpha':alphas, 'epsilon':epsilons}

(Epsilon is required to be larger than one).

Then I can run the cross validated fit with `pipe.fit(X_train,y_train)` where `pipe` is my pipeline

## Poor score
Unfortunately I'm not getting great scores right off the bat. Right now I'm performing an 80/20 split on my sample data into training/testing sets as follows:

	_train_size = 0.8
	_train_cutoff = int(_train_size*X.size)

	X_train, X_test = np.split(X,[_train_cutoff])
	y_train, y_test = np.split(y,[_train_cutoff])

In accordance with the specifications from the sklearn documentation on time series data, I'm only testing on future data and maintaining the consecutive order of data points. My cross validation iterater does the same.

	>>> pipe.score(X_test,y_test)
	0.73681231517651635

That's not a terrible score but most of the examples online are above 90%. I'm running out of time for now but next time I'll look into what the default scoring method actually returns / how to interpret it. I also should see if there are other parameters I could optimize since I just arbitrarily picked alpha and epsilon.
