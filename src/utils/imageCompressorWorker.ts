self.onmessage = async (e: MessageEvent) => {
  const { file, MAX_WIDTH, MAX_HEIGHT } = e.data;
  
  if (!('OffscreenCanvas' in self) || !('createImageBitmap' in self)) {
    self.postMessage({ error: 'OffscreenCanvas not supported' });
    return;
  }

  try {
    const bitmap = await createImageBitmap(file);
    let width = bitmap.width;
    let height = bitmap.height;

    if (width > height) {
      if (width > MAX_WIDTH) {
        height *= MAX_WIDTH / width;
        width = MAX_WIDTH;
      }
    } else {
      if (height > MAX_HEIGHT) {
        width *= MAX_HEIGHT / height;
        height = MAX_HEIGHT;
      }
    }

    const canvas = new OffscreenCanvas(width, height);
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      self.postMessage({ error: 'No 2d context' });
      return;
    }
    
    ctx.drawImage(bitmap, 0, 0, width, height);
    
    const blob = await canvas.convertToBlob({ type: 'image/jpeg', quality: 0.7 });
    self.postMessage({ blob });
  } catch (error) {
    self.postMessage({ error: String(error) });
  }
};

