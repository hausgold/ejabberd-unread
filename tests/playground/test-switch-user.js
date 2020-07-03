async.waterfall([
  (callback) => {
    test.ping((err, to) => { console.log(to); callback(); })
  },
  (callback) => {
    test.switchUser('bob', (test) => {
      test.ping((err, to) => { console.log(to); callback(); })
    })
  },
  (callback) => {
    test.switchUser('alice', (test) => {
      test.ping((err, to) => { console.log(to); callback(); })
    })
  },
], () => {})
