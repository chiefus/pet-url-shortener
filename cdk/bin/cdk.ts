import * as cdk from 'aws-cdk-lib';
import { SkeenGryTestService } from '../lib/cdk-skeen-gry-test-service';

const app = new cdk.App();

new SkeenGryTestService(app, 'aws-fargate-dynamo-application-autoscaling');

app.synth();

