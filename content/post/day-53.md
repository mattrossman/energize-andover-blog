---
author: "Matt Rossman"
date: 2017-08-21
title: Day 53
description: Multi-core processing for a performance boost
weight: 10
featured: true
---

## Function decorators
In python you can put *function decorators* in front of methods to apply some overarching steps to them. In my case I want to time each method call using `time.perf_counter()`. I can either apply a wrapper to every method of a class as explained [here](https://stackoverflow.com/a/25828876/8371763) or just decorate specific methods within my classes.

	def time_func(func):
	    @wraps(func)
	    def wrapper(*args, **kw):
			start = time.perf_counter()
			try:
			    res = func(*args, **kw)
			finally:
			    end = time.perf_counter()
			    dur = '%.2f sec' % (end-start)
			    print('{0}.{1} finished in {2}'.format(
				    args[0].__class__.__name__,
				    func.__name__,
				    dur))
			return res
	    return wrapper
<br>

	>>> model.train()
	MultiRFModel._get_training_windows finished in 0.01 sec
	SingleRFModel._get_feats finished in 1.54 sec
	SingleRFModel._get_training_arrays finished in 1.64 sec
	SingleRFModel.train finished in 3.60 sec
	SingleRFModel._get_feats finished in 1.54 sec
	SingleRFModel._get_training_arrays finished in 1.64 sec
	SingleRFModel.train finished in 3.63 sec
	SingleRFModel._get_feats finished in 1.53 sec
	SingleRFModel._get_training_arrays finished in 1.63 sec
	SingleRFModel.train finished in 3.73 sec
	SingleRFModel._get_feats finished in 1.53 sec
	SingleRFModel._get_training_arrays finished in 1.63 sec
	SingleRFModel.train finished in 3.56 sec
	SingleRFModel._get_feats finished in 1.53 sec
	SingleRFModel._get_training_arrays finished in 1.63 sec
	SingleRFModel.train finished in 3.48 sec
	SingleRFModel._get_feats finished in 1.57 sec
	SingleRFModel._get_training_arrays finished in 1.67 sec
	SingleRFModel.train finished in 3.05 sec
	SingleRFModel._get_feats finished in 1.52 sec
	SingleRFModel._get_training_arrays finished in 1.62 sec
	SingleRFModel.train finished in 3.74 sec
	MultiRFModel.train finished in 24.81 sec

When interpretting this, remember that `_get_feats()` is a subset of `_get_training_arrays()`, which is a subset of `train()`.

You can see that in general, a good chunk of the `SingleRFModel.train()` process is being taken up by the `_get_training_arrays()` step, and most of that comes from the `_get_feats()` step. If I could optimize that step, I could shave close to ten seconds off the training time.

Problem is, I have very little idea how to improve it. I timed the individual steps of `_get_feat()` for a single model:

	Got data features in 1.26 sec
	Got time features in 0.02 sec
	Got extra features in 0.26 sec

I did notice that at the moment, the list comprehension runs `_aggregated_data_features` on every iteration which unecessarily re-runs the downsampling of the data. I changed it so that `_aggregated_data_features` just runs once at the beginning and that shaved a big portion of the time off:

	Got data features in 0.15 sec
	Got time features in 0.02 sec
	Got extra features in 0.26 sec

Which have this overall multi-model performance:

	MultiRFModel.train finished in 16.94 sec

That's approximately a 32% performance improvement. Now, the entire feature generation step takes about half a second for a single model. The biggest time-suck is now scikit-learn's training process.

## Multicore processing
One parameter of `sklearn.ensemble.RandomForestRegressor` that I have ignored thusfar is `n_jobs`. This parameter lets you split up a computational task onto multiple CPU cores. I assumed my chunky old laptop would be single-core, but according to `~$ lscpu` I apparently have two cores (*EDIT: turns out I have 4*). I assume the server has at least this many as well. By setting `n_jobs=-1` the parameter will automatically set to the number of system cores.

	>>> model.train()
	SingleRFModel.train finished in 1.48 sec
	SingleRFModel.train finished in 1.48 sec
	SingleRFModel.train finished in 1.58 sec
	SingleRFModel.train finished in 1.49 sec
	SingleRFModel.train finished in 1.48 sec
	SingleRFModel.train finished in 1.19 sec
	SingleRFModel.train finished in 1.63 sec
	MultiRFModel.train finished in 10.34 sec

Impressive! That's a 58% decrease in training time from my original measurement. And it would be even faster on the higher core (and likely higher clocked) server CPU. I also wonder if I can somehow split up the multi-model processes across CPU cores or if that would break something (since each model would then try to run its own multi-core process).

#### More multiprocessing
The `multiprocess` module lets you perform custom processes across your CPU cores. Interestingly, the `multiprocessing.cpu_count()` method claimed I have 4 cores so I must have been interpreting the `~$ lscpu` output incorrectly.

At first I just followed [this guide](http://sebastianraschka.com/Articles/2014_multiprocessing.html) to quickly get started using `Pool` objects, however after multiple tests I noticed my system start to slow down significantly. I believe this was because I was not running `close()` on the pool objects after finishing training with them. That addition seemed to resolve the gradual system slowdown. This is what I added to the `MultiRFModel.train()` method:

	pool = mp.Pool(processes=mp.cpu_count())
	pool.map(SingleRFModel.train,self.models.values())
	pool.close()

And here's the new performance:

	>> model.train()
	SingleRFModel.train finished in 4.61 sec
	SingleRFModel.train finished in 4.61 sec
	SingleRFModel.train finished in 4.63 sec
	SingleRFModel.train finished in 4.70 sec
	SingleRFModel.train finished in 2.57 sec
	SingleRFModel.train finished in 2.90 sec
	SingleRFModel.train finished in 3.15 sec
	MultiRFModel.train finished in 7.92 sec

Notice that the individual training times do not add up to the total model training times anymore as they are distributed processes now. I assume that previously multiple cores were working on the same problem since the individual model training time is higher here, but the overall training time has improved. It's nearly a 70% improvement from where I was at the start of today.

#### Issue: changes not being preserved
The training process does not seem to be preserved when using the pool mapper. When I try predicting, it thinks the models haven't been fitted yet. Even without the multiprocess part, using a regular `map` to train each of the submodels doesn't preserve the training process while a regular loop does.

#### Solution?
This is still a very new area for me so there's probably a better way to be doing this. From what I read it sounds like the `Pool.map` process deals with clones of objects rather than moving around the original. For that reason I needed my `SingleRFModel.train` method to return a copy of the trained model. Then I made a helper function `MultiModelRF.subtrain` that takes in a (key, value) pair from the dictionary of submodels, trains the submodel, and returns an updated (key, value) pair. These pairs are built into a big list by mapping over `MultiRFModel.models.items()`, and that list is turned *back* into a dictionary with the `dict()` constructor. That dictionary is re-assigned to `MultiRFModel.models`, thus completing the update and reassignment process. By the end of it all I am able to properly `predict` with the trained models.

*EDIT: I actually don't need the `SingleRFModel.train` method to return a copy of itself, I can just train each cloned submodel and return those trained clones.*

The performance boost is not entirely consistent. At least, I'm definitely not get the sub-eight second time I got on my first multiprocess attempt. Sometimes I get better performance using only 2 processes rather than all of the CPU cores. Most of the time the multiprocess approach is better than just a serialized approach, but sometimes the multiprocess implementation will hang and take longer. I'm hoping this just has to do with the limited memory of my laptop but if I have to remove the multiprocess feature in the end, it won't be that big of a performance difference.

	>>> model.train()
	SingleRFModel.train finished in 4.77 sec
	SingleRFModel.train finished in 4.85 sec
	SingleRFModel.train finished in 4.92 sec
	SingleRFModel.train finished in 5.00 sec
	SingleRFModel.train finished in 2.65 sec
	SingleRFModel.train finished in 3.17 sec
	SingleRFModel.train finished in 3.42 sec
	MultiRFModel.train finished in 8.88 sec

Overall about a 64% improvement from the start of today. When I go back to just the school-time subset of data, it feels incredibly quick to train (just a couple of seconds). This makes me more confident in the model efficiency on large future data sets.
