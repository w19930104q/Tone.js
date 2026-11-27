import { Instrument } from "../instrument/Instrument.js";
import { Frequency, NormalRange, Time } from "../core/type/Units.js";

/**
 * SequenceSwitch manages hot-swapping the destination instrument
 * of a Sequence (or any event source) during playback.
 *
 * When you call {@link switchTo}, the old instrument only completes
 * notes that have already started their release — all subsequent
 * events are routed to the new instrument. If the new instrument
 * is disposed or otherwise invalid the switch is rejected and the
 * original connection stays intact.
 *
 * @example
 * const oldSynth = new Tone.Synth({ oscillator: { type: "triangle" } }).toDestination();
 * const newSynth = new Tone.Synth({ oscillator: { type: "square" } }).toDestination();
 *
 * const switcher = new Tone.SequenceSwitch(oldSynth);
 *
 * const seq = new Tone.Sequence((time, note) => {
 *   switcher.triggerAttackRelease(note, "8n", time);
 * }, ["C4", "D4", "E4", "F4", "G4", "A4", "B4", "C5",
 *     "C4", "D4", "E4", "F4", "G4", "A4", "B4", "C5"]).start(0);
 *
 * // switch halfway through
 * Tone.Transport.schedule(() => {
 *   switcher.switchTo(newSynth);
 * }, "2m");
 *
 * Tone.Transport.start();
 * @category Event
 */
export class SequenceSwitch {
	readonly name: string = "SequenceSwitch";

	private _instrument: Instrument<any>;
	private _previousInstrument: Instrument<any> | null = null;

	/**
	 * @param instrument The initial instrument to route events to.
	 */
	constructor(instrument: Instrument<any>) {
		if (!instrument) {
			throw new Error("SequenceSwitch requires a valid initial instrument");
		}
		this._instrument = instrument;
	}

	/**
	 * Switch output to a new instrument. The previous instrument
	 * will only finish notes already in their release phase;
	 * all subsequent events go to the new instrument.
	 *
	 * If the new instrument is disposed or invalid the switch
	 * is silently rejected and the original connection is kept.
	 *
	 * @returns this
	 * @example
	 * switcher.switchTo(newSynth);
	 */
	switchTo(newInstrument: Instrument<any>): this {
		if (!newInstrument || newInstrument.disposed) {
			return this;
		}
		this._previousInstrument = this._instrument;
		this._instrument = newInstrument;
		return this;
	}

	/**
	 * The currently active instrument.
	 */
	get instrument(): Instrument<any> {
		return this._instrument;
	}

	/**
	 * The previously active instrument (before the last switch),
	 * or null if no switch has occurred.
	 */
	get previousInstrument(): Instrument<any> | null {
		return this._previousInstrument;
	}

	/**
	 * Trigger the attack and then the release after the duration
	 * on the currently active instrument.
	 */
	triggerAttackRelease(
		note: Frequency,
		duration: Time,
		time?: Time,
		velocity?: NormalRange,
	): this {
		this._instrument.triggerAttackRelease(note, duration, time, velocity);
		return this;
	}

	/**
	 * Trigger the attack of a note on the currently active instrument.
	 */
	triggerAttack(
		note: Frequency,
		time?: Time,
		velocity?: NormalRange,
	): this {
		this._instrument.triggerAttack(note, time, velocity);
		return this;
	}

	/**
	 * Trigger the release of the currently active instrument.
	 */
	triggerRelease(time?: Time): this {
		this._instrument.triggerRelease(time);
		return this;
	}
}
