import { z } from 'zod';

const ReportSchema = z.object({
    title: z.string().min(3),
    description: z.string().min(10),
    category: z.string(),
    severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
    latitude: z.coerce.number(),
    longitude: z.coerce.number(),
    address: z.string().optional(),
    phoneNumber: z.string().optional(),
    image: z.any(),
    verificationMethod: z.enum(['CALL', 'VIDEO']).default('CALL'),
    video: z.any().optional(),
});

const form = new Map([
    ['title', 'Issue: Pothole'],
    ['description', 'Road surface damage has been detected...'],
    ['category', 'pothole'],
    ['severity', 'MEDIUM'],
    ['latitude', ''],
    ['longitude', ''],
    ['address', ''],
    ['verificationMethod', 'VIDEO']
]);

const validatedFields = ReportSchema.safeParse({
    title: form.get('title'),
    description: form.get('description'),
    category: form.get('category'),
    severity: form.get('severity'),
    latitude: form.get('latitude'),
    longitude: form.get('longitude'),
    address: form.get('address'),
    phoneNumber: form.get('phoneNumber'),
    image: new File([], "test.jpg"),
    verificationMethod: form.get('verificationMethod'),
    video: new File([], "test.mp4")
});

if (!validatedFields.success) {
    console.log(validatedFields.error.flatten().fieldErrors);
} else {
    console.log("Success!", validatedFields.data);
}
