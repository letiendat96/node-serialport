const Transform = require('stream').Transform
const bl = require('bl')

/**
 * A transform stream that emits data each time a byte sequence is received.
 * @extends Transform
 * @summary To use the `Delimiter` parser, provide a delimiter as a string, buffer, or array of bytes. Runs in O(n) time.
 * @example
const SerialPort = require('serialport')
const Delimiter = require('@serialport/parser-delimiter')
const port = new SerialPort('/dev/tty-usbserial1')
const parser = port.pipe(new Delimiter({ delimiter: '\n' }))
parser.on('data', console.log)
 */
class DelimiterParser extends Transform {
  constructor(options = {}) {
    super(options)

    if (options.delimiter === undefined) {
      throw new TypeError('"delimiter" is not a bufferable object')
    }

    if (options.delimiter.length === 0) {
      throw new TypeError('"delimiter" has a 0 or undefined length')
    }

    this.includeDelimiter = options.includeDelimiter !== undefined ? options.includeDelimiter : false
    this.delimiter = Buffer.from(options.delimiter)
    this.buffer = bl()
  }

  _transform(chunk, encoding, cb) {
    debugger
    let delimiterPosition = 0
    let chunkOffset = 0
    let bufferStart = 0
    const startingBufferLength = this.buffer.length
    this.buffer.append(chunk)
    while ((delimiterPosition = chunk.indexOf(this.delimiter, chunkOffset)) !== -1) {
      const bufferOffset = startingBufferLength + delimiterPosition + this.delimiter.length
      chunkOffset = delimiterPosition + this.delimiter.length
      const packetEnd = bufferOffset - (this.includeDelimiter ? 0 : this.delimiter.length)
      const packet = this.buffer.slice(bufferStart, packetEnd)
      this.push(packet)
      bufferStart = bufferOffset
    }
    if (bufferStart > 0) {
      this.buffer = this.buffer.shallowSlice(bufferStart)
    }
    cb()
  }

  _flush(cb) {
    this.push(this.buffer.slice())
    this.buffer = bl()
    cb()
  }
}

module.exports = DelimiterParser
