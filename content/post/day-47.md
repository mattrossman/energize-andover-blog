---
author: "Matt Rossman"
date: 2017-08-10
title: Day 47
description: Starting on a model class
weight: 10
---

Very brief post today as I am really short on time.

Our team met at AHS today but we quickly realized without access to the logged power data there's not a whole lot we can do to start integrating the predictions.

I spent today starting to move the prediction process into it's own class. My goal is to make the prediction process as clean and simple as possible. This is actually my first time using Python classes so it's probably not very elegant. Nonetheless, I've made some progress on a few of the internal functions:

	class rf_model:
	    def __init__(self, data, td_input, td_gap, td_output,time_attrs):
			self.data = data
			self.n = len(data)
			self.data_freq = data.index.freq
			self.td_input = td_input
			self.td_gap = td_gap
			self.td_output = td_output
			self.time_attrs = time_attrs
			self.rf = RandomForestRegressor(n_estimators=10)
		    
	    def _time_features(self,attrs):
			df_f = pd.DataFrame(index=self.data.index)
			for attr in attrs:
			    df_f[attr] = getattr(df_f.index,attr)
			return df_f
		    
	    def _index_windows(self):
			ixs = np.array(range(self.n))
			input_size = int(self.td_input / self.data_freq)
			gap_size = int(self.td_gap / self.data_freq)
			output_size = int(self.td_output / self.data_freq)
			ix_windows = egz.rolling_window(ixs,
				                        input_size
				                        + gap_size
				                        + output_size,
				                        output_size)
			X_ixs,_,y_ixs = np.split(ix_windows,[input_size,input_size+gap_size],1)
			return X_ixs,y_ixs
		    
	    def _training_arrays(self):
			X_ixs,y_ixs = self._index_windows()
			time_feat = self._time_features(self.time_attrs).as_matrix()
			X = np.concatenate((np.array([self.data[w] for w in X_ixs])[:,::int(pd.Timedelta(hours=1)/self.data_freq)],
				            np.array([time_feat[w] for w in y_ixs[:,0]])),
			    axis=1)
			y = np.array([self.data[w] for w in y_ixs])
			return X,y

You can pass in a list of time attributes that you want to use as features and the object will appropriately pull those features from the training data index, combining them with the downsampled historical value features.


