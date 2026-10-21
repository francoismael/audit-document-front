import { FileSizePipe } from './file-size.pipe';

describe('FileSizePipe', () => {
  const pipe = new FileSizePipe();

  it('should format a size in octets, Ko or Mo', () => {
    expect(pipe.transform(512)).toBe('512 octets');
    expect(pipe.transform(18_944)).toBe('18.5 Ko');
    expect(pipe.transform(3 * 1024 * 1024)).toBe('3.00 Mo');
  });
});
