import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  CircularProgress
} from "@mui/material";
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Psychology as TherapyIcon
} from "@mui/icons-material";
import { toast } from 'react-toastify';
import { 
  assignTherapistToStudent, 
  removeTherapistFromStudent,
  type Student
} from "./Api-Requests/StudentAPIService";
import { getAllTherapists, type User } from "./Api-Requests/userHttpService";

interface ApiError {
  response?: {
    data?: {
      message?: string;
    };
  };
}

interface TherapistAssignmentProps {
  student: Student;
  onUpdate: (updatedStudent: Student) => void;
}

const TherapistAssignment: React.FC<TherapistAssignmentProps> = ({ 
  student, 
  onUpdate 
}) => {
  const [therapists, setTherapists] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedTherapistId, setSelectedTherapistId] = useState<string>("");
  const [assigning, setAssigning] = useState(false);

  // Load all therapists
  useEffect(() => {
    loadTherapists();
  }, []);

  const handleCloseDialog = useCallback(() => {
    setDialogOpen(false);
    setSelectedTherapistId("");
  }, []);

  const loadTherapists = async () => {
    try {
      setLoading(true);
      console.log("Loading therapists...");
      const response = await getAllTherapists();
      console.log("Therapists loaded:", response.data);
      setTherapists(response.data);
    } catch (error) {
      console.error("Error loading therapists:", error);
      toast.error("Failed to load therapists");
    } finally {
      setLoading(false);
    }
  };

  const handleAssignTherapist = async () => {
    console.log("handleAssignTherapist called with selectedTherapistId:", selectedTherapistId);
    
    if (!selectedTherapistId || selectedTherapistId === "") {
      toast.error("Please select a therapist");
      return;
    }

    const therapist = therapists.find(t => t.id === selectedTherapistId);
    console.log("Found therapist:", therapist);
    
    if (!therapist) {
      toast.error("Selected therapist not found");
      return;
    }

    try {
      setAssigning(true);
      console.log("About to call assignTherapistToStudent with:", {
        studentId: student._id,
        therapistId: therapist.id,
        therapistName: therapist.name
      });
      
      const response = await assignTherapistToStudent(student._id, {
        therapistId: therapist.id,
        therapistName: therapist.name
      });
      
      console.log("Assignment response:", response);
      onUpdate(response.data.student);
      setDialogOpen(false);
      setSelectedTherapistId("");
      toast.success("Therapist assigned successfully");
    } catch (error: unknown) {
      console.error("Error assigning therapist:", error);
      const errorMessage = (error as ApiError).response?.data?.message || "Failed to assign therapist";
      toast.error(errorMessage);
    } finally {
      setAssigning(false);
    }
  };

  const handleRemoveTherapist = async (therapistId: string, therapistName: string) => {
    if (!confirm(`Are you sure you want to remove ${therapistName} as a therapist for ${student.name}?`)) {
      return;
    }

    try {
      const response = await removeTherapistFromStudent(student._id, {
        therapistId
      });
      
      onUpdate(response.data.student);
      toast.success("Therapist removed successfully");
    } catch (error: unknown) {
      console.error("Error removing therapist:", error);
      const errorMessage = (error as ApiError).response?.data?.message || "Failed to remove therapist";
      toast.error(errorMessage);
    }
  };

  const assignedTherapistIds = student.therapists?.map(t => t._id) || [];
  const availableTherapists = therapists.filter(t => !assignedTherapistIds.includes(t.id));
  
  console.log("Student therapists:", student.therapists);
  console.log("Assigned therapist IDs:", assignedTherapistIds);
  console.log("All therapists:", therapists);
  console.log("Available therapists:", availableTherapists);

  return (
    <Card sx={{ mt: 2 }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <TherapyIcon sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="h6" component="h3">
            Assigned Therapists
          </Typography>
          <Button
            startIcon={<AddIcon />}
            onClick={() => setDialogOpen(true)}
            sx={{ ml: 'auto' }}
            variant="outlined"
            size="small"
            disabled={availableTherapists.length === 0}
          >
            Assign Therapist
          </Button>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
            <CircularProgress size={20} />
          </Box>
        ) : (
          <>
            {!student.therapists || student.therapists.length === 0 ? (
              <Alert severity="info">
                No therapists assigned to this student
              </Alert>
            ) : (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {student.therapists.map((therapist) => (
                  <Chip
                    key={therapist._id}
                    label={therapist.name}
                    color="primary"
                    variant="outlined"
                    deleteIcon={<DeleteIcon />}
                    onDelete={() => handleRemoveTherapist(therapist._id, therapist.name)}
                  />
                ))}
              </Box>
            )}
          </>
        )}

        {/* Assign Therapist Dialog */}
        <Dialog 
          open={dialogOpen} 
          onClose={handleCloseDialog}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Assign Therapist to {student.name}</DialogTitle>
          <DialogContent>
            <FormControl fullWidth sx={{ mt: 2 }}>
              <InputLabel>Select Therapist</InputLabel>
              <Select
                value={selectedTherapistId || ""}
                onChange={(e) => {
                  const newValue = e.target.value;
                  console.log("Select changed to:", newValue, "type:", typeof newValue);
                  setSelectedTherapistId(newValue as string);
                }}
                label="Select Therapist"
              >
                {availableTherapists.map((therapist) => {
                  console.log("Rendering MenuItem for therapist:", therapist.id, therapist.name);
                  return (
                    <MenuItem key={therapist.id} value={therapist.id}>
                      {therapist.name} ({therapist.email})
                    </MenuItem>
                  );
                })}
              </Select>
            </FormControl>
            
            {availableTherapists.length === 0 && (
              <Alert severity="warning" sx={{ mt: 2 }}>
                All available therapists are already assigned to this student
              </Alert>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>
              Cancel
            </Button>
            <Button
              onClick={handleAssignTherapist}
              variant="contained"
              disabled={!selectedTherapistId || selectedTherapistId === "" || assigning}
              startIcon={assigning ? <CircularProgress size={16} /> : <AddIcon />}
            >
              {assigning ? "Assigning..." : "Assign Therapist"}
            </Button>
          </DialogActions>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default TherapistAssignment;
