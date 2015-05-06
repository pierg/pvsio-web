/*
 *   DrugLibraryReaderSfun.c Simple C-MEX S-function for function call.
 *
 *   ABSTRACT:
 *     The purpose of this sfunction is to call a simple legacy
 *     function during simulation:
 *
 *        DrugLibraryReader(uint32 u1[2], uint32 y1[1], uint32 y2[1], uint32 y3[1], uint32 y4[1], double  y5[1], double  y6[1], double  y7[1],double  y8[1],double  y9[1],double  y10[1],double  y11[1],double  y12[1], double  y13[1],double  y14[1],double  y15[1],double  y16[1],double  y17[1],double  y18[1],double  y19[1], double  y20[1],double  y21[1], uint32  y22[1])
 *
 *   Simulink version           : 7.9 (R2012a) 29-Dec-2011
 *   C source code generated on : 27-Mar-2015 17:39:18

 * THIS S-FUNCTION IS GENERATED BY THE LEGACY CODE TOOL AND MAY NOT WORK IF MODIFIED

 */

/*
   %%%-MATLAB_Construction_Commands_Start
   def = legacy_code('initialize');
   def.SFunctionName = 'DrugLibraryReaderSfun';
   def.OutputFcnSpec = 'DrugLibraryReader(uint32 u1[2], uint32 y1[1], uint32 y2[1], uint32 y3[1], uint32 y4[1], double  y5[1], double  y6[1], double  y7[1],double  y8[1],double  y9[1],double  y10[1],double  y11[1],double  y12[1], double  y13[1],double  y14[1],double  y15[1],double  y16[1],double  y17[1],double  y18[1],double  y19[1], double  y20[1],double  y21[1], uint32  y22[1])';
   def.StartFcnSpec = 'openFile()';
   def.TerminateFcnSpec = 'closeFile()';
   def.HeaderFiles = {'DrugLibraryLCT.h'};
   def.SourceFiles = {'DrugLibraryLCT.c'};
   def.SampleTime = 1;
   legacy_code('sfcn_cmex_generate', def);
   legacy_code('compile', def);
   %%%-MATLAB_Construction_Commands_End
 */

/*
 * Must specify the S_FUNCTION_NAME as the name of the S-function.
 */
#define S_FUNCTION_NAME                DrugLibraryReaderSfun
#define S_FUNCTION_LEVEL               2

/*
 * Need to include simstruc.h for the definition of the SimStruct and
 * its associated macro definitions.
 */
#include "simstruc.h"

/*
 * Specific header file(s) required by the legacy code function.
 */
#include "DrugLibraryLCT.h"

/* Function: mdlInitializeSizes ===========================================
 * Abstract:
 *    The sizes information is used by Simulink to determine the S-function
 *    block's characteristics (number of inputs, outputs, states, etc.).
 */
static void mdlInitializeSizes(SimStruct *S)
{
  /* Number of expected parameters */
  ssSetNumSFcnParams(S, 0);

  /*
   * Set the number of pworks.
   */
  ssSetNumPWork(S, 0);

  /*
   * Set the number of dworks.
   */
  if (!ssSetNumDWork(S, 0))
    return;

  /*
   * Set the number of input ports.
   */
  if (!ssSetNumInputPorts(S, 1))
    return;

  /*
   * Configure the input port 1
   */
  ssSetInputPortDataType(S, 0, SS_UINT32);
  ssSetInputPortWidth(S, 0, 2);
  ssSetInputPortComplexSignal(S, 0, COMPLEX_NO);
  ssSetInputPortDirectFeedThrough(S, 0, 1);
  ssSetInputPortAcceptExprInRTW(S, 0, 0);
  ssSetInputPortOverWritable(S, 0, 0);
  ssSetInputPortOptimOpts(S, 0, SS_REUSABLE_AND_LOCAL);
  ssSetInputPortRequiredContiguous(S, 0, 1);

  /*
   * Set the number of output ports.
   */
  if (!ssSetNumOutputPorts(S, 22))
    return;

  /*
   * Configure the output port 1
   */
  ssSetOutputPortDataType(S, 0, SS_UINT32);
  ssSetOutputPortWidth(S, 0, 1);
  ssSetOutputPortComplexSignal(S, 0, COMPLEX_NO);
  ssSetOutputPortOptimOpts(S, 0, SS_REUSABLE_AND_LOCAL);
  ssSetOutputPortOutputExprInRTW(S, 0, 0);

  /*
   * Configure the output port 2
   */
  ssSetOutputPortDataType(S, 1, SS_UINT32);
  ssSetOutputPortWidth(S, 1, 1);
  ssSetOutputPortComplexSignal(S, 1, COMPLEX_NO);
  ssSetOutputPortOptimOpts(S, 1, SS_REUSABLE_AND_LOCAL);
  ssSetOutputPortOutputExprInRTW(S, 1, 0);

  /*
   * Configure the output port 3
   */
  ssSetOutputPortDataType(S, 2, SS_UINT32);
  ssSetOutputPortWidth(S, 2, 1);
  ssSetOutputPortComplexSignal(S, 2, COMPLEX_NO);
  ssSetOutputPortOptimOpts(S, 2, SS_REUSABLE_AND_LOCAL);
  ssSetOutputPortOutputExprInRTW(S, 2, 0);

  /*
   * Configure the output port 4
   */
  ssSetOutputPortDataType(S, 3, SS_UINT32);
  ssSetOutputPortWidth(S, 3, 1);
  ssSetOutputPortComplexSignal(S, 3, COMPLEX_NO);
  ssSetOutputPortOptimOpts(S, 3, SS_REUSABLE_AND_LOCAL);
  ssSetOutputPortOutputExprInRTW(S, 3, 0);

  /*
   * Configure the output port 5
   */
  ssSetOutputPortDataType(S, 4, SS_DOUBLE);
  ssSetOutputPortWidth(S, 4, 1);
  ssSetOutputPortComplexSignal(S, 4, COMPLEX_NO);
  ssSetOutputPortOptimOpts(S, 4, SS_REUSABLE_AND_LOCAL);
  ssSetOutputPortOutputExprInRTW(S, 4, 0);

  /*
   * Configure the output port 6
   */
  ssSetOutputPortDataType(S, 5, SS_DOUBLE);
  ssSetOutputPortWidth(S, 5, 1);
  ssSetOutputPortComplexSignal(S, 5, COMPLEX_NO);
  ssSetOutputPortOptimOpts(S, 5, SS_REUSABLE_AND_LOCAL);
  ssSetOutputPortOutputExprInRTW(S, 5, 0);

  /*
   * Configure the output port 7
   */
  ssSetOutputPortDataType(S, 6, SS_DOUBLE);
  ssSetOutputPortWidth(S, 6, 1);
  ssSetOutputPortComplexSignal(S, 6, COMPLEX_NO);
  ssSetOutputPortOptimOpts(S, 6, SS_REUSABLE_AND_LOCAL);
  ssSetOutputPortOutputExprInRTW(S, 6, 0);

  /*
   * Configure the output port 8
   */
  ssSetOutputPortDataType(S, 7, SS_DOUBLE);
  ssSetOutputPortWidth(S, 7, 1);
  ssSetOutputPortComplexSignal(S, 7, COMPLEX_NO);
  ssSetOutputPortOptimOpts(S, 7, SS_REUSABLE_AND_LOCAL);
  ssSetOutputPortOutputExprInRTW(S, 7, 0);

  /*
   * Configure the output port 9
   */
  ssSetOutputPortDataType(S, 8, SS_DOUBLE);
  ssSetOutputPortWidth(S, 8, 1);
  ssSetOutputPortComplexSignal(S, 8, COMPLEX_NO);
  ssSetOutputPortOptimOpts(S, 8, SS_REUSABLE_AND_LOCAL);
  ssSetOutputPortOutputExprInRTW(S, 8, 0);

  /*
   * Configure the output port 10
   */
  ssSetOutputPortDataType(S, 9, SS_DOUBLE);
  ssSetOutputPortWidth(S, 9, 1);
  ssSetOutputPortComplexSignal(S, 9, COMPLEX_NO);
  ssSetOutputPortOptimOpts(S, 9, SS_REUSABLE_AND_LOCAL);
  ssSetOutputPortOutputExprInRTW(S, 9, 0);

  /*
   * Configure the output port 11
   */
  ssSetOutputPortDataType(S, 10, SS_DOUBLE);
  ssSetOutputPortWidth(S, 10, 1);
  ssSetOutputPortComplexSignal(S, 10, COMPLEX_NO);
  ssSetOutputPortOptimOpts(S, 10, SS_REUSABLE_AND_LOCAL);
  ssSetOutputPortOutputExprInRTW(S, 10, 0);

  /*
   * Configure the output port 12
   */
  ssSetOutputPortDataType(S, 11, SS_DOUBLE);
  ssSetOutputPortWidth(S, 11, 1);
  ssSetOutputPortComplexSignal(S, 11, COMPLEX_NO);
  ssSetOutputPortOptimOpts(S, 11, SS_REUSABLE_AND_LOCAL);
  ssSetOutputPortOutputExprInRTW(S, 11, 0);

  /*
   * Configure the output port 13
   */
  ssSetOutputPortDataType(S, 12, SS_DOUBLE);
  ssSetOutputPortWidth(S, 12, 1);
  ssSetOutputPortComplexSignal(S, 12, COMPLEX_NO);
  ssSetOutputPortOptimOpts(S, 12, SS_REUSABLE_AND_LOCAL);
  ssSetOutputPortOutputExprInRTW(S, 12, 0);

  /*
   * Configure the output port 14
   */
  ssSetOutputPortDataType(S, 13, SS_DOUBLE);
  ssSetOutputPortWidth(S, 13, 1);
  ssSetOutputPortComplexSignal(S, 13, COMPLEX_NO);
  ssSetOutputPortOptimOpts(S, 13, SS_REUSABLE_AND_LOCAL);
  ssSetOutputPortOutputExprInRTW(S, 13, 0);

  /*
   * Configure the output port 15
   */
  ssSetOutputPortDataType(S, 14, SS_DOUBLE);
  ssSetOutputPortWidth(S, 14, 1);
  ssSetOutputPortComplexSignal(S, 14, COMPLEX_NO);
  ssSetOutputPortOptimOpts(S, 14, SS_REUSABLE_AND_LOCAL);
  ssSetOutputPortOutputExprInRTW(S, 14, 0);

  /*
   * Configure the output port 16
   */
  ssSetOutputPortDataType(S, 15, SS_DOUBLE);
  ssSetOutputPortWidth(S, 15, 1);
  ssSetOutputPortComplexSignal(S, 15, COMPLEX_NO);
  ssSetOutputPortOptimOpts(S, 15, SS_REUSABLE_AND_LOCAL);
  ssSetOutputPortOutputExprInRTW(S, 15, 0);

  /*
   * Configure the output port 17
   */
  ssSetOutputPortDataType(S, 16, SS_DOUBLE);
  ssSetOutputPortWidth(S, 16, 1);
  ssSetOutputPortComplexSignal(S, 16, COMPLEX_NO);
  ssSetOutputPortOptimOpts(S, 16, SS_REUSABLE_AND_LOCAL);
  ssSetOutputPortOutputExprInRTW(S, 16, 0);

  /*
   * Configure the output port 18
   */
  ssSetOutputPortDataType(S, 17, SS_DOUBLE);
  ssSetOutputPortWidth(S, 17, 1);
  ssSetOutputPortComplexSignal(S, 17, COMPLEX_NO);
  ssSetOutputPortOptimOpts(S, 17, SS_REUSABLE_AND_LOCAL);
  ssSetOutputPortOutputExprInRTW(S, 17, 0);

  /*
   * Configure the output port 19
   */
  ssSetOutputPortDataType(S, 18, SS_DOUBLE);
  ssSetOutputPortWidth(S, 18, 1);
  ssSetOutputPortComplexSignal(S, 18, COMPLEX_NO);
  ssSetOutputPortOptimOpts(S, 18, SS_REUSABLE_AND_LOCAL);
  ssSetOutputPortOutputExprInRTW(S, 18, 0);

  /*
   * Configure the output port 20
   */
  ssSetOutputPortDataType(S, 19, SS_DOUBLE);
  ssSetOutputPortWidth(S, 19, 1);
  ssSetOutputPortComplexSignal(S, 19, COMPLEX_NO);
  ssSetOutputPortOptimOpts(S, 19, SS_REUSABLE_AND_LOCAL);
  ssSetOutputPortOutputExprInRTW(S, 19, 0);

  /*
   * Configure the output port 21
   */
  ssSetOutputPortDataType(S, 20, SS_DOUBLE);
  ssSetOutputPortWidth(S, 20, 1);
  ssSetOutputPortComplexSignal(S, 20, COMPLEX_NO);
  ssSetOutputPortOptimOpts(S, 20, SS_REUSABLE_AND_LOCAL);
  ssSetOutputPortOutputExprInRTW(S, 20, 0);

  /*
   * Configure the output port 22
   */
  ssSetOutputPortDataType(S, 21, SS_UINT32);
  ssSetOutputPortWidth(S, 21, 1);
  ssSetOutputPortComplexSignal(S, 21, COMPLEX_NO);
  ssSetOutputPortOptimOpts(S, 21, SS_REUSABLE_AND_LOCAL);
  ssSetOutputPortOutputExprInRTW(S, 21, 0);

  /*
   * Register reserved identifiers to avoid name conflict
   */
  if (ssRTWGenIsCodeGen(S)) {
    /*
     * Register reserved identifier for StartFcnSpec
     */
    ssRegMdlInfo(S, "openFile", MDL_INFO_ID_RESERVED, 0, 0, ssGetPath(S));

    /*
     * Register reserved identifier for OutputFcnSpec
     */
    ssRegMdlInfo(S, "DrugLibraryReader", MDL_INFO_ID_RESERVED, 0, 0, ssGetPath(S));

    /*
     * Register reserved identifier for TerminateFcnSpec
     */
    ssRegMdlInfo(S, "closeFile", MDL_INFO_ID_RESERVED, 0, 0, ssGetPath(S));
  }

  /*
   * This S-function can be used in referenced model simulating in normal mode.
   */
  ssSetModelReferenceNormalModeSupport(S, MDL_START_AND_MDL_PROCESS_PARAMS_OK);

  /*
   * Set the number of sample time.
   */
  ssSetNumSampleTimes(S, 1);

  /*
   * All options have the form SS_OPTION_<name> and are documented in
   * matlabroot/simulink/include/simstruc.h. The options should be
   * bitwise or'd together as in
   *   ssSetOptions(S, (SS_OPTION_name1 | SS_OPTION_name2))
   */
  ssSetOptions(S,
               SS_OPTION_USE_TLC_WITH_ACCELERATOR |
               SS_OPTION_CAN_BE_CALLED_CONDITIONALLY |
               SS_OPTION_EXCEPTION_FREE_CODE |
               SS_OPTION_WORKS_WITH_CODE_REUSE |
               SS_OPTION_SFUNCTION_INLINED_FOR_RTW |
               SS_OPTION_DISALLOW_CONSTANT_SAMPLE_TIME);
}

/* Function: mdlInitializeSampleTimes =====================================
 * Abstract:
 *    This function is used to specify the sample time(s) for your
 *    S-function. You must register the same number of sample times as
 *    specified in ssSetNumSampleTimes.
 */
static void mdlInitializeSampleTimes(SimStruct *S)
{
  ssSetSampleTime(S, 0, (real_T)1);
  ssSetOffsetTime(S, 0, (real_T)0);

#if defined(ssSetModelReferenceSampleTimeDisallowInheritance)

  ssSetModelReferenceSampleTimeDisallowInheritance(S);

#endif

}

#define MDL_START
#if defined(MDL_START)

/* Function: mdlStart =====================================================
 * Abstract:
 *    This function is called once at start of model execution. If you
 *    have states that should be initialized once, this is the place
 *    to do it.
 */
static void mdlStart(SimStruct *S)
{
  /*
   * Call the legacy code function
   */
  openFile();
}

#endif

/* Function: mdlOutputs ===================================================
 * Abstract:
 *    In this function, you compute the outputs of your S-function
 *    block. Generally outputs are placed in the output vector(s),
 *    ssGetOutputPortSignal.
 */
static void mdlOutputs(SimStruct *S, int_T tid)
{
  /*
   * Get access to Parameter/Input/Output/DWork/size information
   */
  uint32_T *u1 = (uint32_T *) ssGetInputPortSignal(S, 0);
  uint32_T *y1 = (uint32_T *) ssGetOutputPortSignal(S, 0);
  uint32_T *y2 = (uint32_T *) ssGetOutputPortSignal(S, 1);
  uint32_T *y3 = (uint32_T *) ssGetOutputPortSignal(S, 2);
  uint32_T *y4 = (uint32_T *) ssGetOutputPortSignal(S, 3);
  real_T *y5 = (real_T *) ssGetOutputPortSignal(S, 4);
  real_T *y6 = (real_T *) ssGetOutputPortSignal(S, 5);
  real_T *y7 = (real_T *) ssGetOutputPortSignal(S, 6);
  real_T *y8 = (real_T *) ssGetOutputPortSignal(S, 7);
  real_T *y9 = (real_T *) ssGetOutputPortSignal(S, 8);
  real_T *y10 = (real_T *) ssGetOutputPortSignal(S, 9);
  real_T *y11 = (real_T *) ssGetOutputPortSignal(S, 10);
  real_T *y12 = (real_T *) ssGetOutputPortSignal(S, 11);
  real_T *y13 = (real_T *) ssGetOutputPortSignal(S, 12);
  real_T *y14 = (real_T *) ssGetOutputPortSignal(S, 13);
  real_T *y15 = (real_T *) ssGetOutputPortSignal(S, 14);
  real_T *y16 = (real_T *) ssGetOutputPortSignal(S, 15);
  real_T *y17 = (real_T *) ssGetOutputPortSignal(S, 16);
  real_T *y18 = (real_T *) ssGetOutputPortSignal(S, 17);
  real_T *y19 = (real_T *) ssGetOutputPortSignal(S, 18);
  real_T *y20 = (real_T *) ssGetOutputPortSignal(S, 19);
  real_T *y21 = (real_T *) ssGetOutputPortSignal(S, 20);
  uint32_T *y22 = (uint32_T *) ssGetOutputPortSignal(S, 21);

  /*
   * Call the legacy code function
   */
  DrugLibraryReader( u1, y1, y2, y3, y4, y5, y6, y7, y8, y9, y10, y11, y12, y13,
                    y14, y15, y16, y17, y18, y19, y20, y21, y22);
}

/* Function: mdlTerminate =================================================
 * Abstract:
 *    In this function, you should perform any actions that are necessary
 *    at the termination of a simulation.
 */
static void mdlTerminate(SimStruct *S)
{
  /*
   * Call the legacy code function
   */
  closeFile();
}

/*
 * Required S-function trailer
 */
#ifdef MATLAB_MEX_FILE
# include "simulink.c"
#else
# include "cg_sfun.h"
#endif
