<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

// Function to handle CORS preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Check if request method is POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode([
        'success' => false,
        'message' => 'Method not allowed. Only POST requests are accepted.'
    ]);
    exit();
}

// Get the raw POST data
$json = file_get_contents('php://input');
$data = json_decode($json, true);

// Check if data is valid
if (!$data || !isset($data['courses']) || !is_array($data['courses'])) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Invalid data. Please provide an array of courses.'
    ]);
    exit();
}

$courses = $data['courses'];

// Validate and calculate GPA
$totalCredits = 0;
$totalGradePoints = 0;
$coursesCount = 0;
$validCourses = [];

foreach ($courses as $course) {
    // Validate course structure
    if (!isset($course['name'], $course['credits'], $course['grade'])) {
        continue; // Skip invalid courses
    }
    
    $credits = floatval($course['credits']);
    $grade = floatval($course['grade']);
    
    // Basic validation
    if ($credits <= 0 || $credits > 5 || $grade < 0 || $grade > 4) {
        continue; // Skip invalid values
    }
    
    $totalCredits += $credits;
    $totalGradePoints += $credits * $grade;
    $coursesCount++;
    $validCourses[] = $course;
}

// Calculate GPA
if ($coursesCount > 0 && $totalCredits > 0) {
    $gpa = $totalGradePoints / $totalCredits;
    
    // Prepare response
    $response = [
        'success' => true,
        'gpa' => $gpa,
        'totalCredits' => $totalCredits,
        'totalGradePoints' => $totalGradePoints,
        'coursesCount' => $coursesCount,
        'validCourses' => $validCourses,
        'calculatedAt' => date('Y-m-d H:i:s'),
        'serverInfo' => [
            'backend' => 'PHP',
            'version' => PHP_VERSION,
            'server' => $_SERVER['SERVER_SOFTWARE']
        ]
    ];
} else {
    $response = [
        'success' => false,
        'message' => 'No valid courses to calculate GPA. Please check your input.',
        'coursesCount' => $coursesCount,
        'totalCredits' => $totalCredits
    ];
}

// Log the calculation (optional)
logCalculation($response);

// Send response
echo json_encode($response);

/**
 * Log calculation details to a file (optional)
 */
function logCalculation($data) {
    $logFile = 'calculations.log';
    $logEntry = date('Y-m-d H:i:s') . " - " . json_encode($data) . "\n";
    file_put_contents($logFile, $logEntry, FILE_APPEND | LOCK_EX);
}
?>