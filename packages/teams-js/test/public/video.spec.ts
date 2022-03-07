import { FramelessPostMocks } from '../framelessPostMocks';
import { app } from '../../src/public/app';
import { FrameContexts } from '../../src/public/constants';
import { video } from '../../src/public/video';
import { Utils } from '../utils';
import { DOMMessageEvent } from '../../src/internal/interfaces';

/**
 * Test cases for selectPeople API
 */
describe('video', () => {
  const framelessPlatformMock = new FramelessPostMocks();
  const framedPlatformMock = new Utils();

  beforeEach(() => {
    framelessPlatformMock.messages = [];
    framedPlatformMock.messages = [];
  });

  afterEach(() => {
    // Reset the object since it's a singleton
    if (app._uninitialize) {
      app._uninitialize();
    }
  });
  describe('registerForVideoFrame', () => {
    let emptyVideoEffectCallback = (
      _frame: video.VideoFrame,
      _notifyVideoFrameProcessed: () => void,
      _notifyError: (errorMessage: string) => void,
    ): void => {};
    const videoFrameConfig: video.VideoFrameConfig = {
      format: video.VideoFrameFormat.NV12,
    };

    const allowedContexts = [FrameContexts.sidePanel];
    Object.values(FrameContexts).forEach(context => {
      if (allowedContexts.some(allowedContext => allowedContext === context)) {
        return;
      }

      it('FRAMED - should not allow registerForVideoFrame calls from the wrong context', async () => {
        await framedPlatformMock.initializeWithContext(context);

        expect(() => video.registerForVideoFrame(emptyVideoEffectCallback, videoFrameConfig)).toThrowError(
          `This call is only allowed in following contexts: ${JSON.stringify(
            allowedContexts,
          )}. Current context: "${context}".`,
        );
      });

      it('FRAMELESS - should not allow registerForVideoFrame calls from the wrong context', async () => {
        await framelessPlatformMock.initializeWithContext(context);

        expect(() => video.registerForVideoFrame(emptyVideoEffectCallback, videoFrameConfig)).toThrowError(
          `This call is only allowed in following contexts: ${JSON.stringify(
            allowedContexts,
          )}. Current context: "${context}".`,
        );
      });
    });

    it('FRAMED - should successfully send registerForVideoFrame message', async () => {
      await framedPlatformMock.initializeWithContext(FrameContexts.sidePanel);
      video.registerForVideoFrame(emptyVideoEffectCallback, videoFrameConfig);
      const message = framedPlatformMock.findMessageByFunc('video.registerForVideoFrame');
      expect(message).not.toBeNull();
      expect(message.args.length).toBe(1);
      expect(message.args).toEqual([videoFrameConfig]);
    });

    it('FRAMELESS - should successfully send registerForVideoFrame message', async () => {
      await framelessPlatformMock.initializeWithContext(FrameContexts.sidePanel);
      video.registerForVideoFrame(emptyVideoEffectCallback, videoFrameConfig);
      const message = framelessPlatformMock.findMessageByFunc('video.registerForVideoFrame');
      expect(message).not.toBeNull();
      expect(message.args.length).toBe(1);
      expect(message.args).toEqual([videoFrameConfig]);
    });

    it('FRAMED - should successful register video frame handler', async () => {
      await framedPlatformMock.initializeWithContext('sidePanel');

      video.registerForVideoFrame(emptyVideoEffectCallback, videoFrameConfig);

      const messageForRegister = framedPlatformMock.findMessageByFunc('registerHandler');
      expect(messageForRegister).not.toBeNull();
      expect(messageForRegister.args.length).toBe(1);
      expect(messageForRegister.args[0]).toBe('video.newVideoFrame');
    });

    it('FRAMELESS - should successful register video frame handler', async () => {
      await framelessPlatformMock.initializeWithContext('sidePanel');

      video.registerForVideoFrame(emptyVideoEffectCallback, videoFrameConfig);

      const messageForRegister = framelessPlatformMock.findMessageByFunc('registerHandler');
      expect(messageForRegister).not.toBeNull();
      expect(messageForRegister.args.length).toBe(1);
      expect(messageForRegister.args[0]).toBe('video.newVideoFrame');
    });

    it('FRAMED - should successfully invoke video frame event handler', async () => {
      await framedPlatformMock.initializeWithContext(FrameContexts.sidePanel);
      let returnedVideoFrame: video.VideoFrame;
      let handlerInvoked = false;

      let videoEffectCallback = (
        _frame: video.VideoFrame,
        _notifyVideoFrameProcessed: () => void,
        _notifyError: (errorMessage: string) => void,
      ): void => {
        handlerInvoked = true;
        returnedVideoFrame = _frame;
      };

      video.registerForVideoFrame(videoEffectCallback, videoFrameConfig);
      const videoFrameMock = {
        width: 30,
        height: 40,
        data: 101,
      };
      framedPlatformMock.sendMessage('video.newVideoFrame', videoFrameMock);
      expect(returnedVideoFrame).toEqual(videoFrameMock);
      expect(handlerInvoked).toBeTruthy();
    });

    it('FRAMELESS - should successfully invoke video frame event handler', async () => {
      await framelessPlatformMock.initializeWithContext(FrameContexts.sidePanel);
      let returnedVideoFrame: video.VideoFrame;
      let handlerInvoked = false;
      //callback
      let videoEffectCallback = (
        _frame: video.VideoFrame,
        _notifyVideoFrameProcessed: () => void,
        _notifyError: (errorMessage: string) => void,
      ): void => {
        handlerInvoked = true;
        returnedVideoFrame = _frame;
      };
      video.registerForVideoFrame(videoEffectCallback, videoFrameConfig);
      const videoFrameMock = {
        width: 30,
        height: 40,
        data: 101,
      };
      framelessPlatformMock.respondToMessage({
        data: {
          func: 'video.newVideoFrame',
          args: [videoFrameMock],
        },
      } as DOMMessageEvent);
      expect(handlerInvoked).toBeTruthy();
      expect(returnedVideoFrame).toEqual(videoFrameMock);
    });

    it('FRAMED - should invoke video frame event handler and successfully send videoFrameProcessed', async () => {
      await framedPlatformMock.initializeWithContext(FrameContexts.sidePanel);
      const errorMessage = 'error occurs';
      const videoEffectCallback = (
        _frame: video.VideoFrame,
        _notifyVideoFrameProcessed: () => void,
        _notifyError: (errorMessage: string) => void,
      ): void => {
        if (_frame === null) {
          _notifyError(errorMessage);
        } else {
          _notifyVideoFrameProcessed();
        }
      };

      video.registerForVideoFrame(videoEffectCallback, videoFrameConfig);
      const videoFrameMock = {
        width: 30,
        height: 40,
        data: 101,
      };
      framedPlatformMock.sendMessage('video.newVideoFrame', videoFrameMock);
      const message = framedPlatformMock.findMessageByFunc('video.videoFrameProcessed');

      expect(message).not.toBeNull();
      expect(message.args.length).toBe(0);
    });

    it('FRAMELESS - should invoke video frame event handler and successfully send videoFrameProcessed', async () => {
      await framelessPlatformMock.initializeWithContext(FrameContexts.sidePanel);
      const errorMessage = 'error occurs';
      const videoEffectCallback = (
        _frame: video.VideoFrame,
        _notifyVideoFrameProcessed: () => void,
        _notifyError: (errorMessage: string) => void,
      ): void => {
        if (_frame === null) {
          _notifyError(errorMessage);
        } else {
          _notifyVideoFrameProcessed();
        }
      };

      video.registerForVideoFrame(videoEffectCallback, videoFrameConfig);
      const videoFrameMock = {
        width: 30,
        height: 40,
        data: 101,
      };
      framelessPlatformMock.respondToMessage({
        data: {
          func: 'video.newVideoFrame',
          args: [videoFrameMock],
        },
      } as DOMMessageEvent);
      const message = framelessPlatformMock.findMessageByFunc('video.videoFrameProcessed');

      expect(message).not.toBeNull();
      expect(message.args.length).toBe(0);
    });

    it('FRAMED - should invoke video frame event handler and successfully send notifyError', async () => {
      await framedPlatformMock.initializeWithContext(FrameContexts.sidePanel);
      const errorMessage = 'error occurs';
      const videoEffectCallback = (
        _frame: video.VideoFrame,
        _notifyVideoFrameProcessed: () => void,
        _notifyError: (errorMessage: string) => void,
      ): void => {
        if (_frame === null) {
          _notifyError(errorMessage);
        } else {
          _notifyVideoFrameProcessed();
        }
      };

      video.registerForVideoFrame(videoEffectCallback, videoFrameConfig);

      framedPlatformMock.sendMessage('video.newVideoFrame', null);
      const message = framedPlatformMock.findMessageByFunc('video.notifyError');

      expect(message).not.toBeNull();
      expect(message.args.length).toBe(1);
      expect(message.args[0]).toEqual(errorMessage);
    });

    it('FRAMELESS - should invoke video frame event handler and successfully send notifyError', async () => {
      await framelessPlatformMock.initializeWithContext(FrameContexts.sidePanel);
      const errorMessage = 'error occurs';
      const videoEffectCallback = (
        _frame: video.VideoFrame,
        _notifyVideoFrameProcessed: () => void,
        _notifyError: (errorMessage: string) => void,
      ): void => {
        if (_frame === null) {
          _notifyError(errorMessage);
        } else {
          _notifyVideoFrameProcessed();
        }
      };

      video.registerForVideoFrame(videoEffectCallback, videoFrameConfig);
      framelessPlatformMock.respondToMessage({
        data: {
          func: 'video.newVideoFrame',
          args: [null],
        },
      } as DOMMessageEvent);
      const message = framelessPlatformMock.findMessageByFunc('video.notifyError');

      expect(message).not.toBeNull();
      expect(message.args.length).toBe(1);
      expect(message.args[0]).toEqual(errorMessage);
    });

    it('FRAMED - should not invoke video frame event handler when videoFrame is undefined', async () => {
      await framedPlatformMock.initializeWithContext(FrameContexts.sidePanel);
      let handlerInvoked = false;
      let videoEffectCallback = (
        _frame: video.VideoFrame,
        _notifyVideoFrameProcessed: () => void,
        _notifyError: (errorMessage: string) => void,
      ): void => {
        handlerInvoked = true;
      };
      video.registerForVideoFrame(videoEffectCallback, videoFrameConfig);
      framedPlatformMock.sendMessage('video.newVideoFrame', undefined);
      expect(handlerInvoked).toBe(false);
    });

    it('FRAMELESS - should not invoke video frame event handler when videoFrame is undefined', async () => {
      await framelessPlatformMock.initializeWithContext(FrameContexts.sidePanel);
      let handlerInvoked = false;
      let videoEffectCallback = (
        _frame: video.VideoFrame,
        _notifyVideoFrameProcessed: () => void,
        _notifyError: (errorMessage: string) => void,
      ): void => {
        handlerInvoked = true;
      };
      video.registerForVideoFrame(videoEffectCallback, videoFrameConfig);
      framelessPlatformMock.respondToMessage({
        data: {
          func: 'video.newVideoFrame',
          args: [undefined],
        },
      } as DOMMessageEvent);
      expect(handlerInvoked).toBe(false);
    });
  });

  describe('notifySelectedVideoEffectChanged', () => {
    const effectChangeType = video.EffectChangeType.EffectChanged;
    const effectId = 'effectId';

    const allowedContexts = [FrameContexts.sidePanel];
    Object.values(FrameContexts).forEach(context => {
      if (allowedContexts.some(allowedContext => allowedContext === context)) {
        return;
      }

      it('FRAMED - should not allow notifySelectedVideoEffectChanged calls from the wrong context', async () => {
        await framedPlatformMock.initializeWithContext(context);

        expect(() => video.notifySelectedVideoEffectChanged(effectChangeType, effectId)).toThrowError(
          `This call is only allowed in following contexts: ${JSON.stringify(
            allowedContexts,
          )}. Current context: "${context}".`,
        );
      });
      it('FRAMELESS - should not allow notifySelectedVideoEffectChanged calls from the wrong context', async () => {
        await framelessPlatformMock.initializeWithContext(context);

        expect(() => video.notifySelectedVideoEffectChanged(effectChangeType, effectId)).toThrowError(
          `This call is only allowed in following contexts: ${JSON.stringify(
            allowedContexts,
          )}. Current context: "${context}".`,
        );
      });
    });

    it('FRAMED - should successfully send notifySelectedVideoEffectChanged message', async () => {
      await framedPlatformMock.initializeWithContext(FrameContexts.sidePanel);
      video.notifySelectedVideoEffectChanged(effectChangeType, effectId);
      const message = framedPlatformMock.findMessageByFunc('video.videoEffectChanged');
      expect(message).not.toBeNull();
      expect(message.args.length).toBe(2);
      expect(message.args).toEqual([effectChangeType, effectId]);
    });

    it('FRAMELESS - should successfully send notifySelectedVideoEffectChanged message', async () => {
      await framelessPlatformMock.initializeWithContext(FrameContexts.sidePanel);
      video.notifySelectedVideoEffectChanged(effectChangeType, effectId);
      const message = framelessPlatformMock.findMessageByFunc('video.videoEffectChanged');
      expect(message).not.toBeNull();
      expect(message.args.length).toBe(2);
      expect(message.args).toEqual([effectChangeType, effectId]);
    });
  });

  describe('registerForVideoEffect', () => {
    const allowedContexts = [FrameContexts.sidePanel];
    Object.values(FrameContexts).forEach(context => {
      if (allowedContexts.some(allowedContext => allowedContext === context)) {
        return;
      }

      it('FRAMED - should not allow registerForVideoEffect calls from the wrong context', async () => {
        await framedPlatformMock.initializeWithContext(context);

        // eslint-disable-next-line @typescript-eslint/no-empty-function
        expect(() => video.registerForVideoEffect(() => {})).toThrowError(
          `This call is only allowed in following contexts: ${JSON.stringify(
            allowedContexts,
          )}. Current context: "${context}".`,
        );
      });

      it('FRAMELESS - should not allow registerForVideoEffect calls from the wrong context', async () => {
        await framelessPlatformMock.initializeWithContext(context);

        // eslint-disable-next-line @typescript-eslint/no-empty-function
        expect(() => video.registerForVideoEffect(() => {})).toThrowError(
          `This call is only allowed in following contexts: ${JSON.stringify(
            allowedContexts,
          )}. Current context: "${context}".`,
        );
      });
    });

    it('FRAMED - should successful register effectParameterChange', async () => {
      await framedPlatformMock.initializeWithContext('sidePanel');

      // eslint-disable-next-line @typescript-eslint/no-empty-function
      video.registerForVideoEffect(() => {});

      const messageForRegister = framedPlatformMock.findMessageByFunc('registerHandler');
      expect(messageForRegister).not.toBeNull();
      expect(messageForRegister.args.length).toBe(1);
      expect(messageForRegister.args[0]).toBe('video.effectParameterChange');
    });

    it('FRAMELESS - should successful register effectParameterChange', async () => {
      await framelessPlatformMock.initializeWithContext('sidePanel');

      // eslint-disable-next-line @typescript-eslint/no-empty-function
      video.registerForVideoEffect(() => {});

      const messageForRegister = framelessPlatformMock.findMessageByFunc('registerHandler');
      expect(messageForRegister).not.toBeNull();
      expect(messageForRegister.args.length).toBe(1);
      expect(messageForRegister.args[0]).toBe('video.effectParameterChange');
    });

    it('FRAMED - should successfully invoke effectParameterChange handler', async () => {
      await framedPlatformMock.initializeWithContext(FrameContexts.sidePanel);
      let returnedEffectId: string;
      let handlerInvoked = false;
      const handlerMock = (effectId: string): void => {
        handlerInvoked = true;
        returnedEffectId = effectId;
      };

      video.registerForVideoEffect(handlerMock);
      const effectId = 'sampleEffectId';
      framedPlatformMock.sendMessage('video.effectParameterChange', effectId);
      expect(returnedEffectId).toEqual(effectId);
      expect(handlerInvoked).toBeTruthy();
    });

    it('FRAMELESS - should successfully invoke effectParameterChange handler', async () => {
      await framelessPlatformMock.initializeWithContext(FrameContexts.sidePanel);
      let returnedEffectId: string;
      let handlerInvoked = false;
      const handlerMock = (effectId: string): void => {
        handlerInvoked = true;
        returnedEffectId = effectId;
      };

      video.registerForVideoEffect(handlerMock);
      const effectId = 'sampleEffectId';
      framelessPlatformMock.respondToMessage({
        data: {
          func: 'video.effectParameterChange',
          args: [effectId],
        },
      } as DOMMessageEvent);
      expect(returnedEffectId).toEqual(effectId);
      expect(handlerInvoked).toBeTruthy();
    });
  });
});
