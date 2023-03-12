import * as tf from '@tensorflow/tfjs';
import * as DICTIONARY from './dictionary';

// The number of input elements the ML Model is expecting.
const ENCODING_LENGTH = 20;

export class SpamDetectionModel {
	instance?: SpamDetectionModel;
	model?: tf.LayersModel;

	constructor() {
		this.model = undefined;
		this.instance = undefined;
		if (this.instance) {
			console.log("instance already exists");
			return this.instance;
		} else {
			console.log("created new model singleton instance");
			this.instance = this;
		}
	}

	initialize = async () => {
		const mod = await tf.loadLayersModel("www/model.json");
		this.model = mod;
	}

	predict = async (message: string) : Promise<number | undefined> => {
		if(!this.model){
			console.log("Model not initialized. did you forget to call `.initialze()`?");
			return;
		}
		const inputTensor = await this.tokenize(message);

		const res = await this.model.predict(inputTensor);
		//@ts-ignore
		const data = await res.data();
		//@ts-ignore
		console.log("spam res: ", res.print());
		return data[1];
	}

	tokenize = async (message: string) => {
			const wordArray = message.split(' ', ENCODING_LENGTH - 1);
		  // Always start with the START token.
			let returnArray = [DICTIONARY.START];
  
			// Loop through the words in the sentence you want to encode.
			// If word is found in dictionary, add that number else
			// you add the UNKNOWN token.
			for (var i = 0; i < wordArray.length; i++) {
				//@ts-ignore
				let encoding = DICTIONARY.LOOKUP[wordArray[i]];
				returnArray.push(encoding === undefined ? DICTIONARY.UNKNOWN : encoding);
			}
			
			// Finally if the number of words was < the minimum encoding length
			// minus 1 (due to the start token), fill the rest with PAD tokens.
			while (i < ENCODING_LENGTH - 1) {
				returnArray.push(DICTIONARY.PAD);
				i++;
			}
			
			// Log the result to see what you made.
			console.log([returnArray]);
			
			// Convert to a TensorFlow Tensor and return that.
			return tf.tensor([returnArray]);
	}
}

var modelInstance: SpamDetectionModel;

export const spamDetectionModelInstance = () => {
	if(!modelInstance){
		const newInstance = new SpamDetectionModel();
		modelInstance = newInstance;
		return newInstance;
	}
	return modelInstance;
}