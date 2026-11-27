import { expect } from "chai";

import { BasicTests } from "../../test/helper/Basic.js";
import { atTime, Offline } from "../../test/helper/Offline.js";
import { Time } from "../core/type/Time.js";
import { noOp } from "../core/util/Interface.js";
import { Part } from "./Part.js";
import { Sequence } from "./Sequence.js";
import { ToneEvent } from "./ToneEvent.js";

describe("Part", () => {
	BasicTests(Part);

	context("Constructor", () => {
		it("takes a callback and an array of values", async () => {
			await Offline(() => {
				const callback = noOp;
				const part = new Part(callback, [0, 1, 2]);
				expect(part.callback).to.equal(callback);
				expect(part.length).to.equal(3);
				part.dispose();
			});
		});

		it("can be constructed with no arguments", async () => {
			await Offline(() => {
				const part = new Part();
				expect(part.length).to.equal(0);
				part.dispose();
			});
		});

		it("can pass in arguments in options object", async () => {
			await Offline(() => {
				const callback = noOp;
				const part = new Part({
					callback,
					events: [0, 1, 2],
					humanize: true,
					loop: true,
					loopEnd: "4n",
					probability: 0.3,
				});
				expect(part.callback).to.equal(callback);
				expect(part.length).to.equal(3);
				expect(part.loop).to.be.true;
				expect(part.loopEnd).to.equal(Time("4n").valueOf());
				expect(part.probability).to.equal(0.3);
				expect(part.humanize).to.be.true;
				part.dispose();
			});
		});
	});

	context("Adding / Removing / Getting Events", () => {
		it("can take events in the constructor as an array of times", async () => {
			await Offline(() => {
				const part = new Part(noOp, ["0", "8n", "4n"]);
				expect(part.length).to.equal(3);
				part.dispose();
			});
		});

		it("can take events in the constructor as an array of times and values", async () => {
			await Offline(() => {
				const part = new Part(noOp, [
					["0", "C4"],
					["8n", "D3"],
					["4n", "E4"],
				]);
				expect(part.length).to.equal(3);
				part.dispose();
			});
		});

		it("can retrieve an event using 'at'", async () => {
			await Offline(() => {
				const part = new Part(noOp, [
					["0", 0],
					["8n", "C2"],
					["4n", 2],
				]);
				expect(part.length).to.equal(3);
				expect(part.at(0)).to.be.instanceof(ToneEvent);
				expect((part.at(0) as ToneEvent).value).to.equal(0);
				expect((part.at("8n") as ToneEvent).value).to.equal("C2");
				expect((part.at("4n") as ToneEvent).value).to.equal(2);
				expect(part.at("2n")).to.be.null;
				part.dispose();
			});
		});

		it("can set the value of an existing event with 'at'", async () => {
			await Offline(() => {
				const part = new Part({
					events: [[0, "C3"]],
				});
				expect(part.length).to.equal(1);
				expect((part.at(0) as ToneEvent).value).to.equal("C3");
				part.at(0, "C4");
				expect((part.at(0) as ToneEvent).value).to.equal("C4");
				part.dispose();
			});
		});

		it("can take events in the constructor as an array of objects", async () => {
			await Offline(() => {
				const part = new Part(noOp, [
					{
						note: "C3",
						time: 0.3,
					},
					{
						note: "D3",
						time: 1,
					},
				]);
				expect(part.length).to.equal(2);
				expect((part.at(0.3) as ToneEvent).value).to.be.an("object");
				expect((part.at(0.3) as ToneEvent).value.note).to.equal("C3");
				part.dispose();
			});
		});

		it("can cancel event changes", async () => {
			let count = 0;
			await Offline(({ transport }) => {
				const part = new Part(
					(time) => {
						count++;
					},
					[
						{
							note: "C3",
							time: 0,
						},
						{
							note: "D3",
							time: 0.2,
						},
					]
				)
					.start(0)
					.stop(0.1);
				part.cancel(0.1);
				transport.start(0);
			}, 0.3);
			expect(count).to.equal(2);
		});

		it("can add an event as a time and value", async () => {
			await Offline(() => {
				const part = new Part();
				expect(part.length).to.equal(0);
				part.add(1, "D3");
				expect(part.length).to.equal(1);
				expect((part.at(1) as ToneEvent).value).to.equal("D3");
				part.dispose();
			});
		});

		it("can add an event as an object", async () => {
			await Offline(() => {
				const part = new Part();
				expect(part.length).to.equal(0);
				part.add({
					duration: "8n",
					note: "D4",
					time: 0.5,
				});
				expect(part.length).to.equal(1);
				expect((part.at(0.5) as ToneEvent).value).to.be.an("object");
				expect(
					(part.at(0.5) as ToneEvent).value.duration
				).to.deep.equal("8n");
				expect((part.at(0.5) as ToneEvent).value.note).to.deep.equal(
					"D4"
				);
				part.dispose();
			});
		});

		it("can add another part", async () => {
			await Offline(() => {
				const part = new Part();
				expect(part.length).to.equal(0);
				const subPart = new Part({
					events: [0, 0.5],
				});
				part.add(0.2, subPart);
				expect(part.length).to.equal(1);
				expect(part.at(0.2)).to.equal(subPart);
				part.dispose();
			});
		});

		it("can add a sequence", async () => {
			await Offline(() => {
				const part = new Part();
				expect(part.length).to.equal(0);
				const subPart = new Sequence({
					events: [0, 1, 2, 3],
				});
				part.add(0.2, subPart);
				expect(part.length).to.equal(1);
				expect(part.at(0.2)).to.equal(subPart);
				part.dispose();
			});
		});

		it("can remove an event by time", async () => {
			await Offline(() => {
				const part = new Part({
					events: [
						[0.2, "C3"],
						[0.2, "C4"],
					],
				});
				expect(part.length).to.equal(2);
				part.remove(0.2);
				expect(part.length).to.equal(0);
				part.dispose();
			});
		});

		it("can remove an event by time and value", async () => {
			await Offline(() => {
				const secondEvent = {
					note: "C4",
					time: 0.2,
				};
				const part = new Part({
					events: [[0.2, "C2"], secondEvent],
				});
				expect(part.length).to.equal(2);
				part.remove(0.2, "C2");
				expect(part.length).to.equal(1);
				part.remove(secondEvent);
				expect(part.length).to.equal(0);
				part.dispose();
			});
		});

		it("added events have the same settings as the parent", async () => {
			await Offline(() => {
				const part = new Part({
					events: [
						[0.2, "C3"],
						[0.3, "C4"],
					],
					loopEnd: "1m",
					loopStart: "4n",
					probability: 0.2,
				});
				part.humanize = 0.1;
				const firstEvent = part.at(0.2) as ToneEvent;
				expect(firstEvent.humanize).to.equal(0.1);
				expect(firstEvent.probability).to.equal(0.2);
				// loop duration is the same
				expect(firstEvent.loopEnd).to.equal(Time("1m").valueOf());
				expect(firstEvent.loopStart).to.equal(Time("4n").valueOf());

				const secondEvent = part.at(0.3) as ToneEvent;
				expect(secondEvent.humanize).to.equal(0.1);
				expect(secondEvent.probability).to.equal(0.2);
				// loop duration is the same
				expect(secondEvent.loopEnd).to.equal(Time("1m").valueOf());
				expect(secondEvent.loopStart).to.equal(Time("4n").valueOf());
				part.dispose();
			});
		});

		it("will create an event using at if one wasn't there at that time", async () => {
			await Offline(() => {
				const part = new Part();
				expect(part.length).to.equal(0);
				expect((part.at(0.1, "C4") as ToneEvent).value).to.equal("C4");
				expect(part.length).to.equal(1);
				part.dispose();
			});
		});

		it("can remove all of the events", async () => {
			await Offline(() => {
				const part = new Part(noOp, [0, 1, 2, 3, 4, 5]);
				expect(part.length).to.equal(6);
				part.clear();
				expect(part.length).to.equal(0);
				part.dispose();
			});
		});
	});

	context("Part callback", () => {
		it("does not invoke get invoked until started", async () => {
			await Offline(({ transport }) => {
				const part = new Part(() => {
					throw new Error("shouldn't call this callback");
				}, [0, 0.4]);
				transport.start();
			}, 0.5);
		});

		it("is invoked after it's started", async () => {
			let invocations = 0;
			await Offline(({ transport }) => {
				const part = new Part(() => {
					invocations++;
				}, [0, 0.1]).start(0);
				transport.start();
			}, 0.2);
			expect(invocations).to.equal(2);
		});

		it("passes in the scheduled time to the callback", async () => {
			let invoked = false;
			await Offline(({ transport }) => {
				const startTime = 0.1;
				const part = new Part(
					(time) => {
						expect(time).to.be.a("number");
						expect(time - startTime).to.be.closeTo(0.5, 0.01);
						invoked = true;
					},
					[0.3]
				);
				part.start(0.2);
				transport.start(startTime);
			}, 0.62);
			expect(invoked).to.be.true;
		});

		it("passes in the value to the callback", async () => {
			let invoked = false;
			await Offline(({ transport }) => {
				const part = new Part(
					(time, thing) => {
						expect(time).to.be.a("number");
						expect(thing).to.equal("thing");
						part.dispose();
						invoked = true;
					},
					[[0, "thing"]]
				).start();
				transport.start();
			}, 0.6);
			expect(invoked).to.be.true;
		});

		it("can mute the callback", async () => {
			await Offline(({ transport }) => {
				const part = new Part(() => {
					throw new Error("shouldn't call this callback");
				}, [0, 0.1, 0.2, 0.3]).start();
				part.mute = true;
				expect(part.mute).to.be.true;
				transport.start();
			}, 0.5);
		});

		it("can trigger with some probability", async () => {
			await Offline(({ transport }) => {
				const part = new Part(() => {
					throw new Error("shouldn't call this callback");
				}, [0, 0.1, 0.2, 0.3]).start();
				part.probability = 0;
				expect(part.probability).to.equal(0);
				transport.start();
			}, 0.4);
		});

		it("invokes all of the scheduled events", async () => {
			let count = 0;
			await Offline(({ transport }) => {
				new Part(() => {
					count++;
				}, [0, 0.1, 0.2, 0.3]).start();
				transport.start();
			}, 0.4);
			expect(count).to.equal(4);
		});

		it("invokes all of the scheduled events at the correct times", async () => {
			let count = 0;
			await Offline(({ transport }) => {
				const now = transport.now() + 0.1;
				new Part(
					(time, value) => {
						count++;
						expect(time - now).to.be.closeTo(value, 0.01);
					},
					[
						[0, 0],
						[0.1, 0.1],
						[0.2, 0.2],
					]
				).start();
				transport.start(now);
			}, 0.4);
			expect(count).to.equal(3);
		});

		it("starts an event added after the part was started", async () => {
			let invoked = false;
			await Offline(({ transport }) => {
				const part = new Part({
					events: [[0, 0]],
					loop: true,
					loopEnd: 0.2,
					callback(time, value): void {
						if (value === 1) {
							invoked = true;
						}
					},
				}).start(0);
				transport.start();
				return atTime(0.1, () => {
					part.add(0.1, 1);
				});
			}, 0.6);
			expect(invoked).to.be.true;
		});

		it("can schedule a subpart", async () => {
			let invocations = 0;
			await Offline(({ transport }) => {
				const startTime = 0.1;
				const subPart = new Part({
					events: [
						[0, 1],
						[0.3, 2],
					],
				});
				const part = new Part((time, value) => {
					invocations++;
					if (value === 0) {
						expect(time - startTime).to.be.closeTo(0, 0.01);
					} else if (value === 1) {
						expect(time - startTime).to.be.closeTo(0.2, 0.01);
					} else if (value === 2) {
						expect(time - startTime).to.be.closeTo(0.5, 0.01);
						part.dispose();
					}
				})
					.add(0.2, subPart)
					.add(0, 0)
					.start(0);
				transport.start(startTime);
			}, 0.7);
			expect(invocations).to.equal(3);
		});

		it("can start with an offset", async () => {
			let invoked = false;
			await Offline(({ transport }) => {
				const startTime = 0.1;
				const part = new Part(
					(time, number) => {
						expect(time - startTime).to.be.closeTo(0.1, 0.01);
						expect(number).to.equal(1);
						invoked = true;
					},
					[
						[0, 0],
						[1, 1],
					]
				).start(0, 0.9);
				transport.start(startTime);
			}, 0.3);
			expect(invoked).to.be.true;
		});
	});

	context("Looping", () => {
		it("can be set using a boolean as an argument when created", async () => {
			let callCount = 0;
			await Offline(({ transport }) => {
				new Part({
					events: [
						[0, 1],
						[0.1, 2],
					],
					loop: true,
					loopEnd: 0.2,
					callback(): void {
						callCount++;
					},
				}).start(0);
				transport.start();
			}, 0.55);
			expect(callCount).to.equal(6);
		});

		it("can be toggled off using a boolean", async () => {
			let callCount = 0;
			await Offline(({ transport }) => {
				const part = new Part({
					events: [
						[0, 1],
						[0.1, 2],
					],
					loop: true,
					loopEnd: 0.2,
					callback(): void {
						callCount++;
					},
				}).start(0);
				part.loop = false;
				transport.start();
			}, 0.55);
			expect(callCount).to.equal(2);
		});

		it("can be toggled on using a boolean", async () => {
			let callCount = 0;
			await Offline(({ transport }) => {
				const part = new Part({
					events: [
						[0, 1],
						[0.1, 2],
					],
					loop: false,
					loopEnd: 0.2,
					callback(): void {
						callCount++;
					},
				}).start(0);
				part.loop = true;
				transport.start();
			}, 0.55);
			expect(callCount).to.equal(6);
		});

		it("can be set to loop at a specific interval", async () => {
			let invoked = false;
			await Offline(({ transport }) => {
				let lastCall;
				const part = new Part({
					events: [0],
					loop: true,
					loopEnd: 0.25,
					callback(time): void {
						if (lastCall) {
							invoked = true;
							expect(time - lastCall).to.be.closeTo(0.25, 0.01);
						}
						lastCall = time;
					},
				}).start(0);
				transport.start();
			}, 0.7);
			expect(invoked).to.be.true;
		});

		it("a started part will be stopped if it is after the loopEnd", async () => {
			let invoked = true;
			await Offline(({ transport }) => {
				let switched = false;
				const part = new Part({
					events: [
						[0, 0],
						[0.25, 1],
					],
					loop: true,
					loopEnd: 0.5,
					callback(time, value): void {
						if (value === 1 && !switched) {
							switched = true;
							part.loopEnd = 0.2;
						} else if (switched) {
							expect(value).to.equal(0);
							invoked = true;
						}
					},
				}).start(0);
				transport.start();
			}, 0.7);
			expect(invoked).to.be.true;
		});

		it("a started part will be stopped if it is before the loopStart", async () => {
			let invoked = false;
			await Offline(({ transport }) => {
				let switched = false;
				const part = new Part({
					events: [
						[0, 0],
						[0.25, 1],
					],
					loop: true,
					loopEnd: 0.5,
					callback(time, value): void {
						if (value === 1 && !switched) {
							switched = true;
							part.loopStart = 0.2;
						} else if (switched) {
							expect(value).to.equal(1);
							invoked = true;
						}
					},
				}).start(0);
				transport.start();
			}, 0.7);
			expect(invoked).to.be.true;
		});

		it("can loop a specific number of times", async () => {
			let callCount = 0;
			await Offline(({ transport }) => {
				new Part({
					events: [0, 0.1],
					loop: 3,
					loopEnd: 0.125,
					callback(): void {
						callCount++;
					},
				}).start(0.1);
				transport.start();
			}, 0.8);
			expect(callCount).to.equal(6);
		});

		it("can loop a specific number of times (different set order)", async () => {
			let callCount = 0;
			const times = [0.1, 0.2, 0.4, 0.5];
			await Offline(({ transport }) => {
				const part = new Part({
					events: [0, 0.1],
					callback(time): void {
						expect(times[callCount]).to.be.closeTo(time, 0.01);
						callCount++;
					},
				}).start(0.1);
				part.loop = 2;
				part.loopEnd = 0.3;
				transport.start();
			}, 0.8);
			expect(callCount).to.equal(4);
		});

		it("plays once when loop is 1", async () => {
			let callCount = 0;
			await Offline(({ transport }) => {
				new Part({
					events: [0, 0.1],
					loop: 1,
					loopEnd: 0.125,
					callback(): void {
						callCount++;
					},
				}).start(0.1);
				transport.start();
			}, 0.8);
			expect(callCount).to.equal(2);
		});

		it("plays once when loop is 0", async () => {
			let callCount = 0;
			await Offline(({ transport }) => {
				new Part({
					events: [0, 0.1],
					loop: 0,
					loopEnd: 0.125,
					callback(): void {
						callCount++;
					},
				}).start(0.1);
				transport.start();
			}, 0.8);
			expect(callCount).to.equal(2);
		});

		it("plays once when loop is false", async () => {
			let callCount = 0;
			await Offline(({ transport }) => {
				new Part({
					events: [0, 0.1],
					loop: false,
					loopEnd: 0.125,
					callback(): void {
						callCount++;
					},
				}).start(0.1);
				transport.start();
			}, 0.8);
			expect(callCount).to.equal(2);
		});

		it("can loop between loopStart and loopEnd", async () => {
			let invoked = false;
			await Offline(({ transport }) => {
				new Part({
					events: [
						[0, 0],
						["8n", 1],
						["8n + 16n", 2],
						["4n", 3],
					],
					loop: true,
					loopEnd: "4n",
					loopStart: "8n",
					callback(time, value): void {
						expect(value).to.be.at.least(1);
						expect(value).to.be.at.most(2);
						invoked = true;
					},
				}).start(0);
				transport.start();
			}, 0.8);
			expect(invoked).to.be.true;
		});

		it("can be started and stopped multiple times", async () => {
			let eventTimeIndex = 0;
			await Offline(({ transport }) => {
				const eventTimes = [
					[0.5, 0],
					[0.6, 1],
					[1.1, 0],
					[1.2, 1],
					[1.3, 2],
					[1.4, 0],
					[1.5, 1],
					[1.6, 2],
				];
				new Part({
					events: [
						[0, 0],
						[0.1, 1],
						[0.2, 2],
					],
					loop: true,
					loopEnd: 0.3,
					loopStart: 0,
					callback(time, value): void {
						expect(eventTimes.length).to.be.gt(eventTimeIndex);
						expect(eventTimes[eventTimeIndex][0]).to.be.closeTo(
							time,
							0.05
						);
						expect(eventTimes[eventTimeIndex][1]).to.equal(value);
						eventTimeIndex++;
					},
				})
					.start(0.3)
					.stop(0.81);
				transport.start(0.2).stop(0.61).start(0.8);
			}, 2);
			expect(eventTimeIndex).to.equal(8);
		});

		it("can adjust the loopEnd times", async () => {
			let eventTimeIndex = 0;
			await Offline(({ transport }) => {
				const eventTimes = [
					[0.5, 0],
					[0.6, 1],
					[1.1, 0],
					[1.2, 1],
					[1.3, 2],
					[1.4, 0],
					[1.5, 1],
					[1.6, 2],
				];
				const part = new Part({
					events: [
						[0, 0],
						[0.1, 1],
						[0.2, 2],
					],
					loop: true,
					loopEnd: 0.2,
					loopStart: 0,
					callback(time, value): void {
						expect(eventTimes.length).to.be.gt(eventTimeIndex);
						expect(eventTimes[eventTimeIndex][0]).to.be.closeTo(
							time,
							0.05
						);
						expect(eventTimes[eventTimeIndex][1]).to.equal(value);
						eventTimeIndex++;
					},
				})
					.start(0.3)
					.stop(0.81);
				part.loopEnd = 0.4;
				part.loopEnd = 0.3;
				transport.start(0.2).stop(0.61).start(0.8);
			}, 2);
			expect(eventTimeIndex).to.equal(8);
		});

		it("reports the progress of the loop", async () => {
			let callCount = 0;
			await Offline(({ transport }) => {
				const part = new Part({
					events: [0],
					loop: true,
					loopEnd: 1,
					loopStart: 0,
					callback(): void {
						callCount++;
					},
				}).start(0);
				transport.start(0);
				return (time) => {
					expect(part.progress).to.be.closeTo(time, 0.01);
				};
			}, 0.8);
			expect(callCount).to.equal(1);
		});

		it("can start a loop with an offset", async () => {
			let iteration = 0;
			await Offline(({ transport }) => {
				const now = transport.now();
				const part = new Part(
					(time, number) => {
						if (iteration === 0) {
							expect(number).to.equal(1);
							expect(time - now).to.be.closeTo(0.2, 0.05);
						} else if (iteration === 1) {
							expect(number).to.equal(0);
						}
						iteration++;
					},
					[
						[0, 0],
						[0.25, 1],
					]
				);
				part.loop = true;
				part.loopEnd = 0.5;
				part.start(0, 1.05);
				transport.start(0);
			}, 0.6);
			expect(iteration).to.equal(2);
		});

		it("can start a loop with an offset before loop start", async () => {
			let iteration = 0;
			await Offline(({ transport }) => {
				const part = new Part(
					(time, number) => {
						if (iteration === 0) {
							expect(number).to.equal(0);
						} else if (iteration === 1) {
							expect(number).to.equal(1);
						} else if (iteration === 2) {
							expect(number).to.equal(2);
						} else if (iteration === 3) {
							expect(number).to.equal(1);
						} else if (iteration === 4) {
							expect(number).to.equal(2);
						}
						iteration++;
					},
					[
						[0, 0],
						[0.25, 1],
						[0.3, 2],
					]
				);
				part.loop = true;
				part.loopStart = 0.25;
				part.loopEnd = 0.5;
				part.start(0, 0);
				transport.start(part.now());
			}, 0.7);
			expect(iteration).to.equal(5);
		});
	});

	context("playbackRate", () => {
		it("can adjust the playbackRate", async () => {
			let invoked = false;
			await Offline(({ transport }) => {
				let lastCall;
				new Part({
					events: [0, 0.5],
					loop: true,
					loopEnd: 1,
					playbackRate: 2,
					callback(time): void {
						if (lastCall) {
							invoked = true;
							expect(time - lastCall).to.be.closeTo(0.25, 0.01);
						}
						lastCall = time;
					},
				}).start(0);
				transport.start(0);
			}, 0.7);
			expect(invoked).to.be.true;
		});

		it("can adjust the playbackRate after starting", async () => {
			let invoked = false;
			await Offline(({ transport }) => {
				let lastCall;
				const part = new Part({
					events: [0, 0.25],
					loop: true,
					loopEnd: 0.5,
					playbackRate: 1,
					callback(time): void {
						if (lastCall) {
							expect(time - lastCall).to.be.closeTo(0.5, 0.01);
						} else {
							invoked = true;
							part.playbackRate = 0.5;
						}
						lastCall = time;
					},
				}).start(0);
				transport.start(0);
			}, 0.8);
			expect(invoked).to.be.true;
		});
	});

	context("scheduling", () => {
		it("throws an error if events are scheduling in the wrong order", () => {
			const part = new Part();
			part.start(1);
			expect(() => {
				part.start(0);
			}).to.throw(Error);
			part.dispose();
		});

		it("`toTicks()` with no argument matches the transport's actual current tick after a bpm change (#693)", async () => {
			let actualTicks = 0;
			let noArgTicks = 0;
			await Offline(({ transport }) => {
				transport.bpm.value = 120;
				transport.start(0);
				return atTime(0.5, () => {
					transport.bpm.value = 40;
					actualTicks = transport.getTicksAtTime(transport.now());
					noArgTicks = transport.toTicks();
				});
			}, 0.6);
			expect(noArgTicks).to.be.closeTo(actualTicks, 1);
		});

		it("does not delay a part's note when it is (re)started with no time arg while the transport is running", async () => {
			let callTime: number | undefined;
			await Offline(({ transport }) => {
				const part = new Part(
					(time) => {
						callTime = time;
					},
					[0]
				);
				transport.bpm.value = 120;
				transport.start(0);
				return atTime(0.5, () => {
					part.start();
				});
			}, 1);
			expect(callTime).to.be.closeTo(0.5, 0.02);
		});

		it("does not leave an orphaned repeat after stopping a phase-shifted note before its first occurrence", async () => {
			// a note's own repeat is phase-shifted from the part's start tick;
			// stopping before a phase-shifted note's first occurrence used to miss
			// that boundary, leaving an orphaned repeat that could later collide
			// with a subsequent restart (#864)
			const calls: number[] = [];
			await Offline(({ transport }) => {
				const part = new Part((time) => calls.push(time), [0, 0.5]);
				part.loop = true;
				part.loopEnd = 1;
				transport.bpm.value = 120;
				transport.start(0);
				part.start(0);
				// stop before the note at 0.5s into the loop ever gets to fire
				part.stop(0.1);
				// restart partway through the next cycle
				part.start(200 / 384);
			}, 2);
			expect(calls.length).to.equal(4);
		});
	});

	context("replace", () => {
		it("replaces all events with new data while running", async () => {
			const calls: Array<[number, string]> = [];
			await Offline(({ transport }) => {
				const part = new Part(
					(time, value) => {
						calls.push([time, value]);
					},
					[
						[0, "A"],
						[0.1, "B"],
						[0.2, "C"],
					]
				).start(0);
				transport.start(0);
				return atTime(0.05, () => {
					part.replace([
						[0.15, "X"],
						[0.25, "Y"],
					]);
				});
			}, 0.4);
			// Old events before replace: A at ~0, B at ~0.1
			// New events after replace at 0.05: X at 0.15, Y at 0.25
			// C at 0.2 should NOT fire (cancelled)
			const values = calls.map((c) => c[1]);
			expect(values).to.include("A");
			expect(values).to.include("X");
			expect(values).to.include("Y");
			expect(values).to.not.include("C");
			// B at 0.1 fires before replace at 0.05
			expect(values).to.include("B");
		});

		it("keeps old events running when validation fails", async () => {
			const calls: string[] = [];
			await Offline(({ transport }) => {
				const part = new Part(
					(time, value) => {
						calls.push(value);
					},
					[
						[0, "A"],
						[0.1, "B"],
						[0.2, "C"],
					]
				).start(0);
				transport.start(0);
				return atTime(0.05, () => {
					expect(() => {
						part.replace([
							[0, "X"],
							[-1, "BAD"],
						]);
					}).to.throw(Error);
				});
			}, 0.4);
			// All three original events should still fire
			expect(calls).to.include("A");
			expect(calls).to.include("B");
			expect(calls).to.include("C");
			expect(calls).to.not.include("X");
			expect(calls.length).to.equal(3);
		});

		it("rejects NaN time values", () => {
			Offline(() => {
				const part = new Part(noOp, [[0, "safe"]]);
				expect(() => {
					part.replace([[NaN, "bad"]]);
				}).to.throw(Error);
				expect(part.length).to.equal(1);
				part.dispose();
			});
		});

		it("rejects Infinity time values", () => {
			Offline(() => {
				const part = new Part(noOp, [[0, "safe"]]);
				expect(() => {
					part.replace([[Infinity, "bad"]]);
				}).to.throw(Error);
				expect(part.length).to.equal(1);
				part.dispose();
			});
		});

		it("rejects unparseable time strings", () => {
			Offline(() => {
				const part = new Part(noOp, [[0, "safe"]]);
				expect(() => {
					part.replace([["not-a-time", "bad"]]);
				}).to.throw(Error);
				expect(part.length).to.equal(1);
				part.dispose();
			});
		});

		it("preserves scheduled events that already fired before replace", async () => {
			const calls: string[] = [];
			await Offline(({ transport }) => {
				const part = new Part(
					(time, value) => {
						calls.push(value);
					},
					[
						[0, "old-1"],
						[0.3, "old-2"],
					]
				).start(0);
				transport.start(0);
				return atTime(0.1, () => {
					part.replace([
						[0.2, "new-1"],
						[0.4, "new-2"],
					]);
				});
			}, 0.6);
			// old-1 fired at 0 before replace
			expect(calls).to.include("old-1");
			// old-2 (at 0.3) should NOT fire, replaced at 0.1
			expect(calls).to.not.include("old-2");
			// new events fire
			expect(calls).to.include("new-1");
			expect(calls).to.include("new-2");
		});

		it("sample: 8-bar part with invalid new data", async () => {
			// Build an 8-bar (4/4) part: 2 events per bar = 16 events
			const eightBarEvents: Array<[number, string]> = [];
			for (let bar = 0; bar < 8; bar++) {
				eightBarEvents.push([bar, `bar${bar}-downbeat`]);
				eightBarEvents.push([bar + 0.5, `bar${bar}-upbeat`]);
			}

			const calls: string[] = [];
			await Offline(({ transport }) => {
				const part = new Part(
					(time, value) => {
						calls.push(value);
					},
					eightBarEvents
				).start(0);
				transport.start(0);

				return atTime(0.3, () => {
					// New data has an invalid beat position (negative)
					const badData: Array<[number, string]> = [
						[0, "new-down"],
						[-2, "illegal-negative"],
						[1, "new-up"],
					];
					expect(() => {
						part.replace(badData);
					}).to.throw(Error, /invalid time/);
				});
			}, 2);

			// The original 8-bar events should all have been scheduled
			// (we check that bar 0 and bar 1 events fired before end)
			expect(calls).to.include("bar0-downbeat");
			expect(calls).to.include("bar0-upbeat");
			expect(calls).to.include("bar1-downbeat");
			expect(calls).to.include("bar1-upbeat");
			// No new events leaked through
			expect(calls).to.not.include("new-down");
			expect(calls).to.not.include("new-up");
		});

		it("can replace events on a stopped part (state restoration)", async () => {
			await Offline(() => {
				const part = new Part(noOp, [
					[0, "A"],
					[0.1, "B"],
				]);
				expect(part.length).to.equal(2);
				const result = part.replace([
					[0.2, "X"],
					[0.4, "Y"],
					[0.6, "Z"],
				]);
				expect(result).to.equal(true);
				expect(part.length).to.equal(3);
				expect((part.at(0.2) as ToneEvent).value).to.equal("X");
				expect((part.at(0.4) as ToneEvent).value).to.equal("Y");
				expect((part.at(0.6) as ToneEvent).value).to.equal("Z");
				part.dispose();
			});
		});

		it("no duplicate events fire after replacement", async () => {
			const timestamps: number[] = [];
			await Offline(({ transport }) => {
				const part = new Part(
					(time) => {
						timestamps.push(time);
					},
					[
						[0, 0],
						[0.15, 1],
						[0.3, 2],
					]
				).start(0);
				transport.start(0);
				return atTime(0.05, () => {
					part.replace([
						[0.1, "a"],
						[0.2, "b"],
						[0.35, "c"],
					]);
				});
			}, 0.5);
			// Check no duplicates by ensuring all timestamps are unique
			const unique = new Set(timestamps.map((t) => t.toFixed(4)));
			expect(unique.size).to.equal(timestamps.length);
			// We expect: old event at 0, then new events at 0.1, 0.2, 0.35
			expect(timestamps.length).to.be.at.least(4);
		});
	});

});
