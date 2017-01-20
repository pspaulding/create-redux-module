// simulate a call to an unreliable service
export const unreliableGetCount = (thisNeedsToWork = false) =>
    new Promise((resolve, reject) => {
        if (thisNeedsToWork || Math.random() > .5) {
            // success
            var count = parseInt(Math.random() * 100, 10);
            setTimeout(() => resolve(count), 3000);
        } else {
            // failure
            setTimeout(() => reject('Unable to reach server'), 3000);
        }
    });