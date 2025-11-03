// Simple test to demonstrate test infrastructure is working
describe('Test Infrastructure', () => {
  it('should be able to run basic tests', () => {
    expect(1 + 1).toBe(2);
  });

  it('should handle async operations', async () => {
    const result = await Promise.resolve('test');
    expect(result).toBe('test');
  });

  it('should mock functions properly', () => {
    const mockFunction = jest.fn();
    mockFunction.mockReturnValue('mocked value');
    
    const result = mockFunction();
    expect(result).toBe('mocked value');
    expect(mockFunction).toHaveBeenCalled();
  });
});